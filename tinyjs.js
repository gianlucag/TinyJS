class Component {
    constructor(initialProps = {}) {
        this.props = initialProps;
        this.wrapper = document.createElement("div");
        this.wrapper.style.display = "contents";
        this.resolvedMap = {};

        this._mounted = false;
        this._mountObserver = null;
        this._mountScheduled = false;
    }

    getTemplate() {
        throw new Error("getTemplate() must be implemented");
    }

    build(props) {
        throw new Error("build() must be implemented");
    }

    onMount() {}

    render() {
        this.resolvedMap = {};
        this.build(this.props);

        let html = this.getTemplate();
        html = this._translateAttributeTags(html);
        html = this._processTemplateString(html);

        this.wrapper.innerHTML = html.trim();

        this._applyVisibility(this.wrapper);
        this._applyComponents(this.wrapper);
        this._applyEvents(this.wrapper);

        this._ensureMounted();

        return this.wrapper;
    }

    updateProps(newProps) {
        this.props = { ...this.props, ...newProps };
        this.render();
    }

    buildProp(key, valueOrType, callback) {
        if (typeof valueOrType === "boolean") {
            this.resolvedMap[key] = { type: "visibility", value: valueOrType };
            return;
        }

        if (Array.isArray(valueOrType)) {
            this.resolvedMap[key] = { type: "component", value: valueOrType };
            return;
        }

        if (valueOrType instanceof Component || valueOrType instanceof HTMLElement) {
            this.resolvedMap[key] = { type: "component", value: [valueOrType] };
            return;
        }

        if (typeof valueOrType === "string" && typeof callback === "function") {
            this.resolvedMap[key] = {
                type: "event",
                eventType: valueOrType,
                callback: (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    callback(this);
                }
            };
            return;
        }

        if (typeof valueOrType === "string" || typeof valueOrType === "number") {
            this.resolvedMap[key] = { type: "string", value: String(valueOrType) };
        }
    }

    _ensureMounted() {
        if (this._mounted) return;

        if (this.wrapper.isConnected) {
            this._mounted = true;
            this._disconnectMountObserver();
            this.onMount();
            return;
        }

        if (this._mountObserver || this._mountScheduled) return;

        if (typeof MutationObserver !== "undefined") {
            this._mountObserver = new MutationObserver(() => {
                if (!this._mounted && this.wrapper.isConnected) {
                    this._mounted = true;
                    this._disconnectMountObserver();
                    this.onMount();
                }
            });

            const target = document.documentElement || document.body;
            if (target) {
                this._mountObserver.observe(target, { childList: true, subtree: true });
            }
            return;
        }

        this._mountScheduled = true;
        const defer = typeof queueMicrotask === "function"
            ? queueMicrotask
            : (fn) => Promise.resolve().then(fn);

        defer(() => {
            this._mountScheduled = false;
            if (!this._mounted && this.wrapper.isConnected) {
                this._mounted = true;
                this.onMount();
            }
        });
    }

    _disconnectMountObserver() {
        if (this._mountObserver) {
            this._mountObserver.disconnect();
            this._mountObserver = null;
        }
    }

    _translateAttributeTags(html) {
        return html.replace(/\[\[(.*?)\]\]/g, (m, key) => {
            const def = this.resolvedMap[key];
            if (!def) return m;

            if (def.type === "visibility") return `data-vis="${key}"`;
            if (def.type === "event") return `data-on="${key}"`;

            return m;
        });
    }

    _processTemplateString(html) {
        return html.replace(/\[\[(.*?)\]\]/g, (m, key) => {
            const def = this.resolvedMap[key];
            if (!def) return "";
            if (def.type === "string") return def.value;
            if (def.type === "component") return `<!--COMPONENT:${key}-->`;
            return "";
        });
    }

    _applyVisibility(root) {
        const nodes = Array.from(root.querySelectorAll("[data-vis]"));
        for (const node of nodes) {
            const key = node.getAttribute("data-vis");
            const def = this.resolvedMap[key];
            if (def && def.type === "visibility" && def.value === false) {
                node.remove();
            } else {
                node.removeAttribute("data-vis");
            }
        }
    }

    _applyComponents(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT, null);
        let node;

        while ((node = walker.nextNode())) {
            const match = node.nodeValue.match(/^COMPONENT:(.+)$/);
            if (!match) continue;

            const key = match[1];
            const def = this.resolvedMap[key];
            if (!def || def.type !== "component") continue;

            for (const item of def.value) {
                const el =
                    item instanceof Component ? item.render() :
                    item instanceof HTMLElement ? item :
                    typeof item === "string" ? document.createTextNode(item) :
                    null;

                if (el) node.parentNode.insertBefore(el, node);
            }

            node.parentNode.removeChild(node);
        }
    }

    _applyEvents(root) {
        const nodes = Array.from(root.querySelectorAll("[data-on]"));
        for (const node of nodes) {
            const keys = node.getAttribute("data-on").split(/\s+/).filter(Boolean);
            for (const key of keys) {
                const def = this.resolvedMap[key];
                if (def && def.type === "event") {
                    node.addEventListener(def.eventType, def.callback);
                }
            }
            node.removeAttribute("data-on");
        }
    }
}
