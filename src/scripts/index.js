import "../styles/index.scss";

import { Header } from "./header.js";
import { isMobile } from "./utils.js";
import initDisclosures from "./disclosure.js";
import TomSelect from "tom-select";
import KeenSlider from "keen-slider";

window.app = window.app || {};
window.app.hoverMedia = window.matchMedia("(any-hover: hover)");

document.documentElement.classList.toggle("is-mobile", isMobile.any());

const langSwitchSelector = `[data-component*=":lang-switch:"]`;
const langSwitchPanelSelector = `.lang-switch__panel`;
document.querySelectorAll(langSwitchSelector).forEach(elem => {
	elem.addEventListener("click", (event) => {
		event.stopPropagation();
		if (event.target instanceof Element && 
			(event.target.matches(`${langSwitchPanelSelector}, ${langSwitchPanelSelector} *`))) return;
		elem.classList.toggle("_open");
	});
	elem.querySelector(".lang-switch__close-btn").addEventListener("click", () => {
		elem.classList.remove("_open");
	})
	document.addEventListener("click", ({ target }) => {
		if (target instanceof Element && 
				(target.closest(`${langSwitchSelector}, ${langSwitchPanelSelector}`) ||
				target.matches(`${langSwitchSelector}, ${langSwitchSelector} *, ${langSwitchPanelSelector}, ${langSwitchPanelSelector} *`))) return;
		elem.classList.remove("_open");
	});
});
class SearchField {
	constructor(root, owner) {
		this.owner = owner;
		this.dom = {
			root,
			input: root.querySelector(`.search-field__input`),
			openBtn: root.querySelector(`.search-field__open-btn`),
			closeBtn: root.querySelector(`.search-field__close-btn`),
		};
		this.dom.closeBtn.addEventListener("click", () => this.setOpen(false));

		root.addEventListener("click", (event) => {
			const btn = event.target.closest(".search-field__open-btn");
			if (!btn) return;
			this.toggleOpen();
		})
		
		this.dom.input.addEventListener("input", (event) => this.handleInput(event));
	}
	handleInput(event) {
		this.owner.update();
	}
	toggleOpen() {
		this.setOpen(!this.open);
	}
	setOpen(next) {
		this.open = next;
		this.dom.closeBtn.toggleAttribute("disabled", !next);
		this.dom.root.classList.toggle("_open", next);
		if (next) setTimeout(() => this.dom.input.focus(), 100);
		this.owner.update();
	}
}
class Search {
	constructor(root) {
		this.dom = { root };
		this.dom.results = root.querySelector(".search__results");
		this.field = new SearchField(root.querySelector(`.search__field`), this);
		document.addEventListener("click", (event) => this.handleOutsideClick(event));
		setTimeout(() => {
				console.log("setDrawerOptions");
			app.drawers.get("search-results").setOptions({
				closeOnOutsideClick: {
					checkTarget: (target) => target.matches(".search-field")
				}
			});
		}, 0);
	}
	shouldShowResults() {
		return this.field.dom.input.value.length >= 3 && this.field.open; // Если введено 3 или более знаков, показываем панель с результатами
	}
	update() {
		this.setShowResults(this.shouldShowResults()); 
	}
	handleOutsideClick(event) {
		const path = event.composedPath();
		const isInternalClick = Boolean(path.find(elem => elem === this.field.dom.root || elem === this.dom.results));
		if (isInternalClick) return;
		this.field.setOpen(false);
	}
	setShowResults(next) {
		this.dom.root.classList.toggle("_show-results", next);
		if (next) app.drawers.open("search-results")
		else app.drawers.close("search-results");
	}
}
document.querySelectorAll(`[data-component*=":search:"]`).forEach(elem => new Search(elem));
new Header(document.querySelector("#header"));
app.drawers.init();
app.drawers.get("storefront-filters")?.setOptions({
	modal: false,
	lockPageScroll: false,
});

document.querySelectorAll(`[data-component*=":select:"]`).forEach(elem => {
	const type = elem.getAttribute("data-type")?.match(/:select.(\w+):/)?.[1];
	const options = {
		plugins: {
			addons: {},
		}
	};
	switch(type) {
		case "simple":
			options.controlInput = false;
			break;
	}

	TomSelect.define("addons", function(options = {}) {
		// plugin_options: plugin-specific options
		// this: TomSelect instance
		this.hook('after', 'setup', () => {
			const arrowElem = document.createElement("span");
			arrowElem.classList.add("icon-small-thick-arrow-down", "ts-state-indicator");
			this.control.append(arrowElem);
		});
		this.hook('after', 'open', () => {
			this.dropdown.classList.add("open");
			this.dropdown.setAttribute("aria-hidden", false);
		});
		this.hook('after', 'close', () => {
			this.dropdown.classList.remove("open");
			this.dropdown.setAttribute("aria-hidden", true);
			this.blur();
		});
	});
	

	new TomSelect(elem, options);
});

document.querySelectorAll(`[data-component*=":grid-type-select:"]`).forEach(elem => {
	const root = elem.closest(".storefront");
	const gridBtn = elem.querySelector(".grid-type-select__btn_grid");
	const columnBtn = elem.querySelector(".grid-type-select__btn_column");
	
	gridBtn.addEventListener("click", () => {
			root.classList.add("_layout-grid");
			root.classList.remove("_layout-column");
			gridBtn.classList.add("_active");
			columnBtn.classList.remove("_active");
		});
	columnBtn.addEventListener("click", () => {
			root.classList.remove("_layout-grid");
			root.classList.add("_layout-column");
			columnBtn.classList.add("_active");
			gridBtn.classList.remove("_active");
		});
});
document.querySelectorAll(`[data-component*=":recomendations:"]`).forEach(root => {
	const body = root.querySelector(".recomendations__body");
	let intervalId = null, timeoutId = null;
	const setAutoDrag = (slider) => {
		intervalId = setInterval(() => slider.next(), 3000);
	};
	const slider = new KeenSlider(body, {
		loop: true,
		selector: ".recomendations__item",
		slides: {
			perView: 4,
			spacing: 30,
		},
		breakpoints: {
			"(max-width: 1024px)": {
				slides: {
					perView: 3,
					spacing: 20,
				},
			},
			"(max-width: 768px)": {
				slides: {
					perView: 2,
					spacing: 20,
				},
			}
		},
		created: (slider) => setAutoDrag(slider),
		slideChanged: () => {
			clearInterval(intervalId);
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => setAutoDrag(slider), 2000);
		},
	});
	root.querySelector(".recomendations__btn_prev")?.addEventListener("click", () => slider.prev());
	root.querySelector(".recomendations__btn_next")?.addEventListener("click", () => slider.next());
});
document.querySelectorAll(`[data-component*=":category-recomendations:"]`).forEach(root => {
	const body = root.querySelector(".recomendations__body");
	const slider = new KeenSlider(body, {
		loop: true,
		disabled: true,
		selector: ".recomendations__item",
		breakpoints: {
			"(max-width: 768px)": {
				disabled: false,
				slides: {
					perView: "auto",
					spacing: 16,
				},
			}
		},
	});
});

document.querySelectorAll(`[data-component*=":multilevel-checklist:"]`).forEach(root => {
	const checkboxes = root.querySelectorAll(".multilevel-checklist__checkbox");
	checkboxes.forEach(elem => {
		if (elem.matches(".multilevel-checklist__checkbox_current")) {
			elem.addEventListener("click", (event) => {
				event.preventDefault();
				if ()
			});
		} else {

		}
		
	});
});

document.querySelectorAll(`[data-component*=":product-card-media:"]`).forEach(root => {
	const main = root.querySelector(".product-card-media__main");
	const thumbsBody = root.querySelector(".product-card-media-thumbs__body");
	const thumbsPrevBtn = root.querySelector(".product-card-media-thumbs__prev-btn");
	const thumbsNextBtn = root.querySelector(".product-card-media-thumbs__next-btn");
	const mainSlider = new KeenSlider(main, {
		loop: true,
		selector: ".product-card-main-media__item",
		disabled: true,
		breakpoints: {
			"(max-width: 1024px)": {
				disabled: false,
				slides: {
					perView: 1,
					spacing: 0,
				},
			},
			"(max-width: 768px)": {
				disabled: false,
				slides: {
					perView: 2.2,
					spacing: 7,
				},
			},
			"(max-width: 520px)": {
				disabled: false,
				slides: {
					perView: 1.2,
					spacing: 7,
				},
			}
		},
	});
	thumbsPrevBtn.addEventListener("click", () => {
		thumbsSlider.prev();
	});
	thumbsNextBtn.addEventListener("click", () => {
		thumbsSlider.next();
	});
	const thumbsSlider = new KeenSlider(thumbsBody, {
		loop: true,
		selector: ".product-card-media-thumbs__item",
		vertical: true,
		slides: {
			perView: 3,
			spacing: 10,
		},
	});
	thumbsSlider.slides.forEach((elem, idx) => {
		elem.addEventListener("click", () => mainSlider.moveToIdx(idx));
	});
	// if (mainSlider.slides.length <= 4) {

	// } else if (mainSlider.slides.length == 5) {
		
	// } else if (mainSlider.slides.length == 6) {

	// } else {

	// }
	// root.classList.add()
});
const seoHiddenSection =  document.querySelector("#seo-hidden");
if (seoHiddenSection) {
	document.querySelector("#seo-toggle-btn")?.addEventListener("click", () => {
		seoHiddenSection.classList.toggle("_open");
	});
}

initDisclosures();