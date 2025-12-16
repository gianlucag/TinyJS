# TinyJS — a minimal JavaScript component framework

A small, vanilla JavaScript component system built to understand and control the DOM directly, without abstractions or virtual DOMs.

This project was created to explore how component-based frameworks work internally by solving real problems step by step: rendering, event handling, visibility, component composition, and lifecycle management.

It is intentionally minimal and explicit.  
It is not meant to replace existing frameworks, but to clearly demonstrate how they can be built.

---

## What This Project Shows

This repository demonstrates practical skills in:

- JavaScript class design
- DOM rendering pipelines
- Event scoping and isolation
- Component composition
- Lifecycle management
- API design without external dependencies

The goal is clarity and control over abstraction and convenience.

---

## Core Ideas

- Declarative templates using `[[tag]]`
- No virtual DOM
- Real DOM manipulation
- Explicit component composition
- Scoped and isolated events
- Minimal lifecycle (`onMount`)
- Zero dependencies

---

## Basic Example

```javascript
class Chip extends Component {
	getTemplate() {
		return `
            <div [[click]] class="chip">
                <span>[[label]]</span>
            </div>
        `;
	}

	build(props) {
		this.buildProp("label", props.label);
		this.buildProp("click", "click", (self) => {
			alert(self.props.label);
		});
	}

	onMount() {
		console.log("Chip mounted");
	}
}
```

```javascript
const chip = new Chip({
	label: "Hello",
	click: () => {},
});

document.body.append(chip.render());
```

---

## Template Tags ([[tag]])

Templates use `[[tag]]` placeholders.  
The behavior of a tag depends on how it is defined via `buildProp`.

---

### 1. String Tags

Used for text or attribute interpolation.

Template:

```html
<div>[[label]]</div>
```

build:

```javascript
this.buildProp("label", props.label);
```

---

### 2. Visibility Tags

Used as attributes, not as text.

If the value is `false`, the element is removed from the DOM.

Template:

```html
<div [[vis]]>Visible only if true</div>
```

build:

```javascript
this.buildProp("vis", props.visible);
```

---

### 3. Event Tags

Declared as attributes using `[[eventName]]`.

Event behavior:

- Automatically bound
- Scoped to the component
- `stopPropagation()` and `preventDefault()` applied by default
- Callback receives `(event, componentInstance)`

Template:

```html
<button [[click]]>Click me</button>
```

build:

```javascript
this.buildProp("click", "click", (self) => {
	console.log("Clicked", self);
});
```

---

### 4. Component Tags (Composition)

Used to insert child components or DOM nodes.

Template:

```html
<div class="list">[[items]]</div>
```

build:

```javascript
const chip1 = new Chip({ label: "One" });
const chip2 = new Chip({ label: "Two" });

this.buildProp("items", [chip1, chip2]);
```

Supported values:

- other Component instances
- HTMLElement
- strings (converted to text nodes)

---

## buildProp Summary

Signatures:

```javascript
buildProp(key, value);
buildProp(key, eventType, callback);
```

Examples:

```javascript
this.buildProp("title", "Hello");
this.buildProp("vis", true);
this.buildProp("click", "click", handler);
this.buildProp("items", [comp1, comp2]);
```

---

## Lifecycle: onMount

Each component can optionally define:

```javascript
onMount() {}
```

It is called once, when the component is actually inserted into the DOM.

Typical use cases:

- DOM measurements
- observers
- animations
- focus management
- third-party integrations

---

## Rendering Model

- Each component uses a stable internal wrapper (`display: contents`)
- `render()` always returns the same wrapper
- Re-rendering updates the inner content
- No virtual DOM
- No diffing (by design)

---

## Philosophy

This framework prioritizes clarity and control over abstraction.

It is designed to expose how component systems work at a low level, rather than hiding behavior behind complex tooling.

If you want performance optimizations, large ecosystems, or batteries-included solutions, use an established framework.

If you want to understand how those frameworks can be built, this project focuses on that path.

---

## License

MIT
