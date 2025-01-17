
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const alliance = writable("Red");
    const teamNumber = writable();
    const autoNotif = writable(false);
    const name = writable("");
    const matchStage = writable(0);
    const matchStageString = writable("auto");
    const taxi = writable(false);
    const clicks = writable(0);
    const attentionAlert = writable(false);
    const startPosX = writable(-500);
    const startPosY = writable(-500);
    const autoStage = writable(1);
    const pageLoadNoClick = writable(true);
    const autoUpperScore = writable(0);
    const autoUpperFail = writable(0);
    const autoLowerScore = writable(0);
    const autoLowerFail = writable(0);
    const teleUpperScore = writable(0);
    const teleUpperFail = writable(0);
    const teleLowerScore = writable(0);
    const teleLowerFail = writable(0);
    const climbAttemptLevel = writable(0);
    const climbSuccessLevel = writable(0);
    const playDefenseDuration = writable(0);
    const playDefenseQuality = writable(0);
    const receiveDefenseDuration = writable(0);
    const drivingQuality = writable(0);
    const sauceQuality = writable(0);
    const intakeQuality = writable(0);
    const error = writable(false);
    const comment = writable("");

    /* src\HeaderBlob.svelte generated by Svelte v3.48.0 */
    const file$c = "src\\HeaderBlob.svelte";

    // (80:4) {:else}
    function create_else_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Attention";
    			set_style(button, "font-size", "25px");
    			set_style(button, "font-family", "Roboto,sans-serif");
    			attr_dev(button, "class", "w-1/6 h-24 btn btn-outline btn-secondary");
    			add_location(button, file$c, 81, 8, 2279);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*attentionShift*/ ctx[12], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(80:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (76:4) {#if attention}
    function create_if_block_1$2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Attention";
    			set_style(button, "font-size", "25px");
    			set_style(button, "font-family", "Roboto,sans-serif");
    			attr_dev(button, "class", "w-1/6 h-24 btn btn-error");
    			add_location(button, file$c, 77, 8, 2076);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*attentionShift*/ ctx[12], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(76:4) {#if attention}",
    		ctx
    	});

    	return block;
    }

    // (90:4) {:else}
    function create_else_block$6(ctx) {
    	let label;

    	const block = {
    		c: function create() {
    			label = element("label");
    			label.textContent = "Blue";
    			set_style(label, "font-size", "25px");
    			set_style(label, "font-family", "Roboto,sans-serif");
    			attr_dev(label, "for", "my-modal-4");
    			attr_dev(label, "class", "btn modal-button w-1/6 h-24 btn btn-outline btn-primary");
    			add_location(label, file$c, 91, 8, 2751);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$6.name,
    		type: "else",
    		source: "(90:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (87:4) {#if alliance==="Red"}
    function create_if_block$6(ctx) {
    	let label;

    	const block = {
    		c: function create() {
    			label = element("label");
    			label.textContent = "Red";
    			set_style(label, "font-size", "25px");
    			set_style(label, "font-family", "Roboto,sans-serif");
    			attr_dev(label, "for", "my-modal-4");
    			attr_dev(label, "class", "btn modal-button w-1/6 h-24 btn btn-outline btn-error");
    			add_location(label, file$c, 88, 8, 2545);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(87:4) {#if alliance===\\\"Red\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let header;
    	let button0;
    	let t0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let t6;
    	let t7;
    	let input;
    	let t8;
    	let label1;
    	let label0;
    	let h3;
    	let t11;
    	let p0;
    	let t16;
    	let p1;
    	let t21;
    	let p2;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*attention*/ ctx[0]) return create_if_block_1$2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*alliance*/ ctx[3] === "Red") return create_if_block$6;
    		return create_else_block$6;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			button0 = element("button");
    			t0 = text(/*$matchStageString*/ ctx[1]);
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = `${/*scoutName*/ ctx[10]}`;
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = `${/*teamNumber*/ ctx[2]}`;
    			t5 = space();
    			if_block0.c();
    			t6 = space();
    			if_block1.c();
    			t7 = space();
    			input = element("input");
    			t8 = space();
    			label1 = element("label");
    			label0 = element("label");
    			h3 = element("h3");
    			h3.textContent = `${/*alliance*/ ctx[3]} Alliance Summary - PlaceHolder`;
    			t11 = space();
    			p0 = element("p");
    			p0.textContent = `Driver Station 1: ${/*teammate1*/ ctx[4]} - ${/*teammate1Name*/ ctx[7]}`;
    			t16 = space();
    			p1 = element("p");
    			p1.textContent = `Driver Station 2: ${/*teammate2*/ ctx[5]} - ${/*teammate2Name*/ ctx[8]}`;
    			t21 = space();
    			p2 = element("p");
    			p2.textContent = `Driver Station 3: ${/*teammate3*/ ctx[6]} - ${/*teammate3Name*/ ctx[9]}`;
    			set_style(button0, "font-size", "75px");
    			set_style(button0, "font-family", "Roboto,sans-serif");
    			attr_dev(button0, "class", "w-2/6 h-24 btn btn-outline btn-primary");
    			add_location(button0, file$c, 66, 4, 1491);
    			set_style(button1, "font-size", "20px");
    			set_style(button1, "font-family", "Roboto,sans-serif");
    			attr_dev(button1, "class", "w-1/6 h-24 btn btn-outline btn-secondary");
    			add_location(button1, file$c, 69, 4, 1681);
    			set_style(button2, "font-size", "35px");
    			set_style(button2, "font-family", "Roboto,sans-serif");
    			attr_dev(button2, "class", "w-1/6 h-24 btn btn-outline btn-secondary");
    			add_location(button2, file$c, 72, 4, 1842);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "my-modal-4");
    			attr_dev(input, "class", "modal-toggle");
    			add_location(input, file$c, 97, 4, 2965);
    			attr_dev(h3, "class", "text-lg font-bold");
    			add_location(h3, file$c, 100, 12, 3184);
    			attr_dev(p0, "class", "py-4");
    			add_location(p0, file$c, 101, 12, 3274);
    			attr_dev(p1, "class", "py-4");
    			add_location(p1, file$c, 102, 12, 3355);
    			attr_dev(p2, "class", "py-4");
    			add_location(p2, file$c, 103, 12, 3436);
    			attr_dev(label0, "class", "modal-box relative");
    			add_location(label0, file$c, 99, 8, 3136);
    			attr_dev(label1, "for", "my-modal-4");
    			attr_dev(label1, "class", "modal cursor-pointer");
    			set_style(label1, "font-family", "Roboto,sans-serif");
    			add_location(label1, file$c, 98, 4, 3033);
    			attr_dev(header, "class", "flex items-start gap-x-1");
    			add_location(header, file$c, 64, 0, 1411);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, button0);
    			append_dev(button0, t0);
    			append_dev(header, t1);
    			append_dev(header, button1);
    			append_dev(header, t3);
    			append_dev(header, button2);
    			append_dev(header, t5);
    			if_block0.m(header, null);
    			append_dev(header, t6);
    			if_block1.m(header, null);
    			append_dev(header, t7);
    			append_dev(header, input);
    			append_dev(header, t8);
    			append_dev(header, label1);
    			append_dev(label1, label0);
    			append_dev(label0, h3);
    			append_dev(label0, t11);
    			append_dev(label0, p0);
    			append_dev(label0, t16);
    			append_dev(label0, p1);
    			append_dev(label0, t21);
    			append_dev(label0, p2);

    			if (!mounted) {
    				dispose = listen_dev(button0, "click", /*modeShift*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$matchStageString*/ 2) set_data_dev(t0, /*$matchStageString*/ ctx[1]);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(header, t6);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if_block0.d();
    			if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $matchStage;
    	let $matchStageString;
    	validate_store(matchStage, 'matchStage');
    	component_subscribe($$self, matchStage, $$value => $$invalidate(13, $matchStage = $$value));
    	validate_store(matchStageString, 'matchStageString');
    	component_subscribe($$self, matchStageString, $$value => $$invalidate(1, $matchStageString = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('HeaderBlob', slots, []);
    	let teamNumber = 6328;
    	let alliance = "Blue";
    	let attention;
    	let teammate1 = 6328;
    	let teammate2 = 3467;
    	let teammate3 = 2713;
    	let teammate1Name = "Mechanical Advantage";
    	let teammate2Name = "Windham Windup";
    	let teammate3Name = "iRaiders";
    	let modeString = "auto";
    	let scoutName = "Connor";

    	const attentionSub = attentionAlert.subscribe(value => {
    		$$invalidate(0, attention = value);
    	});

    	function modeShift() {
    		if ($matchStage < 3) {
    			matchStage.update(n => n + 1);
    		} else {
    			matchStage.update(n => 1);
    		}

    		switch ($matchStage) {
    			case 0:
    				matchStageString.update(n => "setup");
    				break;
    			case 1:
    				matchStageString.update(n => "auto");
    				break;
    			case 2:
    				matchStageString.update(n => "tele");
    				break;
    			case 3:
    				matchStageString.update(n => "post");
    				break;
    			case 1:
    				matchStageString.update(n => "qr");
    				break;
    		}
    	}

    	function attentionShift() {
    		$$invalidate(0, attention = !attention);
    		attentionAlert.update(n => !n);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<HeaderBlob> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		clicks,
    		matchStage,
    		matchStageString,
    		startPosX,
    		attentionAlert,
    		teamNumber,
    		alliance,
    		attention,
    		teammate1,
    		teammate2,
    		teammate3,
    		teammate1Name,
    		teammate2Name,
    		teammate3Name,
    		modeString,
    		scoutName,
    		attentionSub,
    		modeShift,
    		attentionShift,
    		$matchStage,
    		$matchStageString
    	});

    	$$self.$inject_state = $$props => {
    		if ('teamNumber' in $$props) $$invalidate(2, teamNumber = $$props.teamNumber);
    		if ('alliance' in $$props) $$invalidate(3, alliance = $$props.alliance);
    		if ('attention' in $$props) $$invalidate(0, attention = $$props.attention);
    		if ('teammate1' in $$props) $$invalidate(4, teammate1 = $$props.teammate1);
    		if ('teammate2' in $$props) $$invalidate(5, teammate2 = $$props.teammate2);
    		if ('teammate3' in $$props) $$invalidate(6, teammate3 = $$props.teammate3);
    		if ('teammate1Name' in $$props) $$invalidate(7, teammate1Name = $$props.teammate1Name);
    		if ('teammate2Name' in $$props) $$invalidate(8, teammate2Name = $$props.teammate2Name);
    		if ('teammate3Name' in $$props) $$invalidate(9, teammate3Name = $$props.teammate3Name);
    		if ('modeString' in $$props) modeString = $$props.modeString;
    		if ('scoutName' in $$props) $$invalidate(10, scoutName = $$props.scoutName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		attention,
    		$matchStageString,
    		teamNumber,
    		alliance,
    		teammate1,
    		teammate2,
    		teammate3,
    		teammate1Name,
    		teammate2Name,
    		teammate3Name,
    		scoutName,
    		modeShift,
    		attentionShift
    	];
    }

    class HeaderBlob extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HeaderBlob",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src\AutoLobby.svelte generated by Svelte v3.48.0 */
    const file$b = "src\\AutoLobby.svelte";

    // (71:8) {:else}
    function create_else_block$5(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let svg_x_value;
    	let svg_y_value;
    	let svg_intro;
    	let svg_outro;
    	let current;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z");
    			add_location(path0, file$b, 71, 208, 2648);
    			attr_dev(path1, "d", "M15 11a3 3 0 11-6 0 3 3 0 016 0z");
    			add_location(path1, file$b, 72, 12, 2758);
    			attr_dev(svg, "x", svg_x_value = /*selectX*/ ctx[0] - 110);
    			attr_dev(svg, "y", svg_y_value = /*selectY*/ ctx[1] - 165);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "h-12 w-12 z-30 overflow-visible");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 50 50");
    			attr_dev(svg, "stroke", "#2563eb");
    			add_location(svg, file$b, 71, 8, 2448);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*selectX*/ 1 && svg_x_value !== (svg_x_value = /*selectX*/ ctx[0] - 110)) {
    				attr_dev(svg, "x", svg_x_value);
    			}

    			if (!current || dirty & /*selectY*/ 2 && svg_y_value !== (svg_y_value = /*selectY*/ ctx[1] - 165)) {
    				attr_dev(svg, "y", svg_y_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (svg_outro) svg_outro.end(1);
    				svg_intro = create_in_transition(svg, fade, { duration: 3000 });
    				svg_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (svg_intro) svg_intro.invalidate();
    			svg_outro = create_out_transition(svg, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (detaching && svg_outro) svg_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(71:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (68:4) {#if !pageLoadNoClickValue}
    function create_if_block_1$1(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let svg_x_value;
    	let svg_y_value;
    	let svg_intro;
    	let svg_outro;
    	let current;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z");
    			add_location(path0, file$b, 68, 186, 2259);
    			attr_dev(path1, "d", "M15 11a3 3 0 11-6 0 3 3 0 016 0z");
    			add_location(path1, file$b, 69, 12, 2369);
    			attr_dev(svg, "x", svg_x_value = /*selectX*/ ctx[0] - 110);
    			attr_dev(svg, "y", svg_y_value = /*selectY*/ ctx[1] - 165);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "h-12 w-12 z-30 overflow-visible");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 50 50");
    			attr_dev(svg, "stroke", "#2563eb");
    			add_location(svg, file$b, 68, 8, 2081);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*selectX*/ 1 && svg_x_value !== (svg_x_value = /*selectX*/ ctx[0] - 110)) {
    				attr_dev(svg, "x", svg_x_value);
    			}

    			if (!current || dirty & /*selectY*/ 2 && svg_y_value !== (svg_y_value = /*selectY*/ ctx[1] - 165)) {
    				attr_dev(svg, "y", svg_y_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (svg_outro) svg_outro.end(1);
    				svg_intro = create_in_transition(svg, fade, {});
    				svg_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (svg_intro) svg_intro.invalidate();
    			svg_outro = create_out_transition(svg, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if (detaching && svg_outro) svg_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(68:4) {#if !pageLoadNoClickValue}",
    		ctx
    	});

    	return block;
    }

    // (83:0) {#if tarmacLoad}
    function create_if_block$5(ctx) {
    	let div;
    	let p;
    	let img;
    	let img_src_value;
    	let p_intro;
    	let p_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "static/images/tarmac.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Pic Name");
    			attr_dev(img, "class", "w-full");
    			add_location(img, file$b, 86, 8, 2987);
    			add_location(p, file$b, 84, 4, 2925);
    			attr_dev(div, "class", "float-right w-3/7 mr-24 relative z-10");
    			add_location(div, file$b, 83, 4, 2867);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*tarmacClick*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (p_outro) p_outro.end(1);
    				p_intro = create_in_transition(p, fly, { y: 400, duration: 2000 });
    				p_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (p_intro) p_intro.invalidate();
    			p_outro = create_out_transition(p, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && p_outro) p_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(83:0) {#if tarmacLoad}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let button;
    	let t0;
    	let svg1;
    	let path;
    	let svg0;
    	let t1;
    	let svg2;
    	let current_block_type_index;
    	let if_block0;
    	let t2;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_1$1, create_else_block$5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*pageLoadNoClickValue*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*tarmacLoad*/ ctx[2] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Begin Auto\r\n    ");
    			svg1 = svg_element("svg");
    			path = svg_element("path");
    			svg0 = svg_element("svg");
    			t1 = space();
    			svg2 = svg_element("svg");
    			if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M13 5l7 7-7 7M5 5l7 7-7 7");
    			add_location(path, file$b, 61, 116, 1815);
    			attr_dev(svg0, "data-content", "./images/taxi-cab.svg");
    			add_location(svg0, file$b, 62, 4, 1923);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "class", "h-12 w-12");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke", "currentColor");
    			add_location(svg1, file$b, 61, 4, 1703);
    			attr_dev(button, "class", "btn btn-outline btn-success gap-2 mt-36 ml-36 w-72 h-48 text-2xl absolute");
    			add_location(button, file$b, 59, 0, 1570);
    			attr_dev(svg2, "class", "overflow-visible absolute z-30");
    			add_location(svg2, file$b, 66, 0, 1993);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, svg1);
    			append_dev(svg1, path);
    			append_dev(svg1, svg0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, svg2, anchor);
    			if_blocks[current_block_type_index].m(svg2, null);
    			insert_dev(target, t2, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*startAuto*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(svg2, null);
    			}

    			if (/*tarmacLoad*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*tarmacLoad*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$5(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(svg2);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t2);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AutoLobby', slots, []);
    	let attentionAlertValue;

    	const attentionAlertSubscription = attentionAlert.subscribe(value => {
    		attentionAlertValue = value;
    	});

    	let storeStartX;
    	let storeStartY;
    	let autoStageValue;
    	let selectX;
    	let selectY;
    	let tarmacLoad = false;
    	let pageLoadNoClickValue;

    	setTimeout(
    		function () {
    			$$invalidate(2, tarmacLoad = true);
    		},
    		200
    	);

    	const startXSub = startPosX.subscribe(value => {
    		$$invalidate(0, selectX = value);
    	});

    	const pageLoadNoClickSub = pageLoadNoClick.subscribe(value => {
    		$$invalidate(3, pageLoadNoClickValue = value);
    	});

    	const startYSub = startPosY.subscribe(value => {
    		$$invalidate(1, selectY = value);
    	});

    	const autoStageSub = autoStage.subscribe(value => {
    		autoStageValue = value;
    	});

    	pageLoadNoClick.update(n => true);

    	function tarmacClick(event) {
    		startPosX.update(n => event.clientX);
    		startPosY.update(n => event.clientY);
    		pageLoadNoClick.update(n => false);
    	}

    	function startAuto() {
    		storeStartX = selectX;
    		storeStartY = selectY;

    		setTimeout(
    			function () {
    				autoStageValue += 1;
    				autoStage.update(n => n + 1);
    			},
    			200
    		);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AutoLobby> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		attentionAlert,
    		clicks,
    		startPosX,
    		startPosY,
    		autoStage,
    		pageLoadNoClick,
    		attentionAlertValue,
    		fade,
    		fly,
    		attentionAlertSubscription,
    		storeStartX,
    		storeStartY,
    		autoStageValue,
    		selectX,
    		selectY,
    		tarmacLoad,
    		pageLoadNoClickValue,
    		startXSub,
    		pageLoadNoClickSub,
    		startYSub,
    		autoStageSub,
    		tarmacClick,
    		startAuto
    	});

    	$$self.$inject_state = $$props => {
    		if ('attentionAlertValue' in $$props) attentionAlertValue = $$props.attentionAlertValue;
    		if ('storeStartX' in $$props) storeStartX = $$props.storeStartX;
    		if ('storeStartY' in $$props) storeStartY = $$props.storeStartY;
    		if ('autoStageValue' in $$props) autoStageValue = $$props.autoStageValue;
    		if ('selectX' in $$props) $$invalidate(0, selectX = $$props.selectX);
    		if ('selectY' in $$props) $$invalidate(1, selectY = $$props.selectY);
    		if ('tarmacLoad' in $$props) $$invalidate(2, tarmacLoad = $$props.tarmacLoad);
    		if ('pageLoadNoClickValue' in $$props) $$invalidate(3, pageLoadNoClickValue = $$props.pageLoadNoClickValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selectX, selectY, tarmacLoad, pageLoadNoClickValue, tarmacClick, startAuto];
    }

    class AutoLobby extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AutoLobby",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\AutoScoutControls.svelte generated by Svelte v3.48.0 */

    const file$a = "src\\AutoScoutControls.svelte";

    function create_fragment$b(ctx) {
    	let div18;
    	let div8;
    	let div7;
    	let div0;
    	let button0;
    	let svg0;
    	let path0;
    	let t0;
    	let div1;
    	let span1;
    	let span0;
    	let t1;
    	let div2;
    	let button1;
    	let svg1;
    	let path1;
    	let t2;
    	let div3;
    	let svg2;
    	let path2;
    	let t3;
    	let div4;
    	let button2;
    	let svg3;
    	let path3;
    	let t4;
    	let div5;
    	let span3;
    	let span2;
    	let t5;
    	let div6;
    	let button3;
    	let svg4;
    	let path4;
    	let t6;
    	let div17;
    	let div16;
    	let div9;
    	let button4;
    	let svg5;
    	let path5;
    	let t7;
    	let div10;
    	let span5;
    	let span4;
    	let t8;
    	let div11;
    	let button5;
    	let svg6;
    	let path6;
    	let t9;
    	let div12;
    	let svg7;
    	let path7;
    	let t10;
    	let div13;
    	let button6;
    	let svg8;
    	let path8;
    	let t11;
    	let div14;
    	let span7;
    	let span6;
    	let t12;
    	let div15;
    	let button7;
    	let svg9;
    	let path9;
    	let div18_intro;
    	let t13;
    	let span9;
    	let span8;
    	let span9_intro;
    	let t14;
    	let button8;
    	let svg10;
    	let path10;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div18 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span0 = element("span");
    			t1 = space();
    			div2 = element("div");
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t2 = space();
    			div3 = element("div");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t3 = space();
    			div4 = element("div");
    			button2 = element("button");
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			t4 = space();
    			div5 = element("div");
    			span3 = element("span");
    			span2 = element("span");
    			t5 = space();
    			div6 = element("div");
    			button3 = element("button");
    			svg4 = svg_element("svg");
    			path4 = svg_element("path");
    			t6 = space();
    			div17 = element("div");
    			div16 = element("div");
    			div9 = element("div");
    			button4 = element("button");
    			svg5 = svg_element("svg");
    			path5 = svg_element("path");
    			t7 = space();
    			div10 = element("div");
    			span5 = element("span");
    			span4 = element("span");
    			t8 = space();
    			div11 = element("div");
    			button5 = element("button");
    			svg6 = svg_element("svg");
    			path6 = svg_element("path");
    			t9 = space();
    			div12 = element("div");
    			svg7 = svg_element("svg");
    			path7 = svg_element("path");
    			t10 = space();
    			div13 = element("div");
    			button6 = element("button");
    			svg8 = svg_element("svg");
    			path8 = svg_element("path");
    			t11 = space();
    			div14 = element("div");
    			span7 = element("span");
    			span6 = element("span");
    			t12 = space();
    			div15 = element("div");
    			button7 = element("button");
    			svg9 = svg_element("svg");
    			path9 = svg_element("path");
    			t13 = space();
    			span9 = element("span");
    			span8 = element("span");
    			t14 = space();
    			button8 = element("button");
    			svg10 = svg_element("svg");
    			path10 = svg_element("path");
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "stroke-width", "3");
    			attr_dev(path0, "d", "M12 4v16m8-8H4");
    			add_location(path0, file$a, 118, 133, 3373);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 39 39");
    			attr_dev(svg0, "stroke", "currentColor");
    			add_location(svg0, file$a, 118, 10, 3250);
    			attr_dev(button0, "class", "btn btn-success btn-outline btn-square w-36 h-24 ");
    			add_location(button0, file$a, 117, 8, 3144);
    			attr_dev(div0, "class", "box row-start-1 row-span-1 col-start-1 col-span-1 absolute z-20");
    			add_location(div0, file$a, 115, 6, 3020);
    			set_style(span0, "--value", /*autoUpperScoreValue*/ ctx[1]);
    			add_location(span0, file$a, 124, 2, 3702);
    			attr_dev(span1, "class", "countdown text-5xl ml-11 mt-3 font-bold");
    			add_location(span1, file$a, 123, 8, 3644);
    			attr_dev(div1, "class", "box row-start-2 row-span-1 col-start-1 col-span-1 content-center z-10");
    			add_location(div1, file$a, 121, 6, 3511);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "3");
    			attr_dev(path1, "d", "M20 12H4");
    			add_location(path1, file$a, 130, 133, 4136);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 39 39");
    			attr_dev(svg1, "stroke", "currentColor");
    			add_location(svg1, file$a, 130, 10, 4013);
    			attr_dev(button1, "class", "btn btn-success btn-outline btn-square w-36 h-24 -mt-5");
    			add_location(button1, file$a, 129, 8, 3902);
    			attr_dev(div2, "class", "box row-start-3 row-span-1 col-start-1 col-span-1 z-30");
    			add_location(div2, file$a, 127, 6, 3785);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "stroke-width", "3");
    			attr_dev(path2, "d", "M8 7l4-4m0 0l4 4m-4-4v18");
    			add_location(path2, file$a, 135, 132, 4497);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "class", "h-24 w-24 ml-6 mt-20");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "viewBox", "0 0 28 28");
    			attr_dev(svg2, "stroke", "currentColor");
    			add_location(svg2, file$a, 135, 8, 4373);
    			attr_dev(div3, "class", "box row-start-1 row-span-3 col-start-2 col-span-1");
    			add_location(div3, file$a, 133, 6, 4268);
    			attr_dev(path3, "stroke-linecap", "round");
    			attr_dev(path3, "stroke-linejoin", "round");
    			attr_dev(path3, "stroke-width", "3");
    			attr_dev(path3, "d", "M12 4v16m8-8H4");
    			add_location(path3, file$a, 140, 133, 4969);
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "viewBox", "0 0 39 39");
    			attr_dev(svg3, "stroke", "currentColor");
    			add_location(svg3, file$a, 140, 10, 4846);
    			attr_dev(button2, "class", "btn btn-error btn-outline btn-square w-36 h-24 -ml-3");
    			add_location(button2, file$a, 139, 8, 4740);
    			attr_dev(div4, "class", "box row-start-1 row-span-1 col-start-3 col-span-1 z-20");
    			add_location(div4, file$a, 137, 6, 4626);
    			set_style(span2, "--value", /*autoUpperFailValue*/ ctx[2]);
    			add_location(span2, file$a, 146, 2, 5280);
    			attr_dev(span3, "class", "countdown text-5xl ml-8 mt-3 font-bold");
    			add_location(span3, file$a, 145, 8, 5223);
    			attr_dev(div5, "class", "box row-start-2 row-span-1 col-start-3 col-span-1 z-10");
    			add_location(div5, file$a, 143, 6, 5107);
    			attr_dev(path4, "stroke-linecap", "round");
    			attr_dev(path4, "stroke-linejoin", "round");
    			attr_dev(path4, "stroke-width", "3");
    			attr_dev(path4, "d", "M20 12H4");
    			add_location(path4, file$a, 152, 133, 5714);
    			attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg4, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg4, "fill", "none");
    			attr_dev(svg4, "viewBox", "0 0 39 39");
    			attr_dev(svg4, "stroke", "currentColor");
    			add_location(svg4, file$a, 152, 10, 5591);
    			attr_dev(button3, "class", "btn btn-error btn-outline btn-square w-36 h-24 -ml-3 -mt-5");
    			add_location(button3, file$a, 151, 8, 5478);
    			attr_dev(div6, "class", "box row-start-3 row-span-1 col-start-3 col-span-1 z-30");
    			add_location(div6, file$a, 149, 6, 5362);
    			attr_dev(div7, "class", "grid grid-cols-3 grid-rows-3 gap-2 w-2/5 h-2/5 absolute ml-36 mt-1");
    			add_location(div7, file$a, 114, 4, 2931);
    			attr_dev(div8, "class", "box row-start-1 row-span-1 col-start-1 col-span-1");
    			add_location(div8, file$a, 107, 2, 2850);
    			attr_dev(path5, "stroke-linecap", "round");
    			attr_dev(path5, "stroke-linejoin", "round");
    			attr_dev(path5, "stroke-width", "3");
    			attr_dev(path5, "d", "M12 4v16m8-8H4");
    			add_location(path5, file$a, 177, 133, 6422);
    			attr_dev(svg5, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg5, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg5, "fill", "none");
    			attr_dev(svg5, "viewBox", "0 0 39 39");
    			attr_dev(svg5, "stroke", "currentColor");
    			add_location(svg5, file$a, 177, 10, 6299);
    			attr_dev(button4, "class", "btn btn-success btn-outline btn-square w-36 h-24");
    			add_location(button4, file$a, 176, 8, 6196);
    			attr_dev(div9, "class", "box row-start-1 row-span-1 col-start-1 col-span-1 absolute z-20");
    			add_location(div9, file$a, 174, 6, 6064);
    			set_style(span4, "--value", /*autoLowerScoreValue*/ ctx[3]);
    			add_location(span4, file$a, 183, 2, 6743);
    			attr_dev(span5, "class", "countdown text-5xl ml-11 mt-3 font-bold");
    			add_location(span5, file$a, 182, 8, 6685);
    			attr_dev(div10, "class", "box row-start-2 row-span-1 col-start-1 col-span-1 z-10");
    			add_location(div10, file$a, 180, 6, 6560);
    			attr_dev(path6, "stroke-linecap", "round");
    			attr_dev(path6, "stroke-linejoin", "round");
    			attr_dev(path6, "stroke-width", "3");
    			attr_dev(path6, "d", "M20 12H4");
    			add_location(path6, file$a, 189, 133, 7184);
    			attr_dev(svg6, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg6, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg6, "fill", "none");
    			attr_dev(svg6, "viewBox", "0 0 39 39");
    			attr_dev(svg6, "stroke", "currentColor");
    			add_location(svg6, file$a, 189, 10, 7061);
    			attr_dev(button5, "class", "btn btn-success btn-outline btn-square w-36 h-24 -mt-5");
    			add_location(button5, file$a, 188, 8, 6951);
    			attr_dev(div11, "class", "box row-start-3 row-span-1 col-start-1 col-span-1 z-30");
    			add_location(div11, file$a, 186, 6, 6826);
    			attr_dev(path7, "stroke-linecap", "round");
    			attr_dev(path7, "stroke-linejoin", "round");
    			attr_dev(path7, "stroke-width", "3");
    			attr_dev(path7, "d", "M16 17l-4 4m0 0l-4-4m4 4V3");
    			add_location(path7, file$a, 194, 132, 7553);
    			attr_dev(svg7, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg7, "class", "h-24 w-24 ml-6 mt-20");
    			attr_dev(svg7, "fill", "none");
    			attr_dev(svg7, "viewBox", "0 0 28 28");
    			attr_dev(svg7, "stroke", "currentColor");
    			add_location(svg7, file$a, 194, 8, 7429);
    			attr_dev(div12, "class", "box row-start-1 row-span-3 col-start-2 col-span-1");
    			add_location(div12, file$a, 192, 6, 7316);
    			attr_dev(path8, "stroke-linecap", "round");
    			attr_dev(path8, "stroke-linejoin", "round");
    			attr_dev(path8, "stroke-width", "3");
    			attr_dev(path8, "d", "M12 4v16m8-8H4");
    			add_location(path8, file$a, 199, 133, 8035);
    			attr_dev(svg8, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg8, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg8, "fill", "none");
    			attr_dev(svg8, "viewBox", "0 0 39 39");
    			attr_dev(svg8, "stroke", "currentColor");
    			add_location(svg8, file$a, 199, 10, 7912);
    			attr_dev(button6, "class", "btn btn-error btn-outline btn-square w-36 h-24 -ml-3");
    			add_location(button6, file$a, 198, 8, 7806);
    			attr_dev(div13, "class", "box row-start-1 row-span-1 col-start-3 col-span-1 z-20");
    			add_location(div13, file$a, 196, 6, 7684);
    			set_style(span6, "--value", /*autoLowerFailValue*/ ctx[4]);
    			add_location(span6, file$a, 205, 2, 8354);
    			attr_dev(span7, "class", "countdown text-5xl ml-8 mt-3 font-bold");
    			add_location(span7, file$a, 204, 8, 8297);
    			attr_dev(div14, "class", "box row-start-2 row-span-1 col-start-3 col-span-1 z-10");
    			add_location(div14, file$a, 202, 6, 8173);
    			attr_dev(path9, "stroke-linecap", "round");
    			attr_dev(path9, "stroke-linejoin", "round");
    			attr_dev(path9, "stroke-width", "3");
    			attr_dev(path9, "d", "M20 12H4");
    			add_location(path9, file$a, 211, 133, 8796);
    			attr_dev(svg9, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg9, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg9, "fill", "none");
    			attr_dev(svg9, "viewBox", "0 0 39 39");
    			attr_dev(svg9, "stroke", "currentColor");
    			add_location(svg9, file$a, 211, 10, 8673);
    			attr_dev(button7, "class", "btn btn-error btn-outline btn-square w-36 h-24 -ml-3 -mt-5");
    			add_location(button7, file$a, 210, 8, 8560);
    			attr_dev(div15, "class", "box row-start-3 row-span-1 col-start-3 col-span-1 z-30");
    			add_location(div15, file$a, 208, 6, 8436);
    			attr_dev(div16, "class", "grid grid-cols-3 grid-rows-3 gap-2 w-2/5 h-2/5 absolute ml-36 -mt-9");
    			add_location(div16, file$a, 173, 4, 5974);
    			attr_dev(div17, "class", "box row-start-2 row-span-1 col-start-1 col-span-1 -mt-[10px]");
    			add_location(div17, file$a, 167, 2, 5884);
    			attr_dev(div18, "class", "grid grid-cols-1 grid-rows-2 gap-2 w-full h-full absolute ");
    			add_location(div18, file$a, 106, 0, 2746);
    			set_style(span8, "--value", parseInt(/*duration*/ ctx[5] / 1000 - /*elapsed*/ ctx[0] / 1000 + 0.99));
    			add_location(span8, file$a, 232, 2, 9120);
    			attr_dev(span9, "class", "countdown font-mono text-6xl ml-6 mt-6 relative absolute z-30");
    			set_style(span9, "color", "#fbbf24");
    			add_location(span9, file$a, 231, 0, 8980);
    			attr_dev(path10, "stroke-linecap", "round");
    			attr_dev(path10, "stroke-linejoin", "round");
    			attr_dev(path10, "stroke-width", "2");
    			attr_dev(path10, "d", "M7 16l-4-4m0 0l4-4m-4 4h18");
    			add_location(path10, file$a, 236, 123, 9450);
    			attr_dev(svg10, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg10, "class", "h-14 -mt-2 -ml-1");
    			attr_dev(svg10, "fill", "none");
    			attr_dev(svg10, "viewBox", "0 0 20 20");
    			attr_dev(svg10, "stroke", "currentColor");
    			add_location(svg10, file$a, 236, 4, 9331);
    			attr_dev(button8, "class", "btn btn-square btn-outline btn-primary absolute z-30 mt-24 -ml-20 w-24 h-20");
    			add_location(button8, file$a, 235, 2, 9211);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div18, anchor);
    			append_dev(div18, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div0);
    			append_dev(div0, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div7, t0);
    			append_dev(div7, div1);
    			append_dev(div1, span1);
    			append_dev(span1, span0);
    			append_dev(div7, t1);
    			append_dev(div7, div2);
    			append_dev(div2, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(div7, t2);
    			append_dev(div7, div3);
    			append_dev(div3, svg2);
    			append_dev(svg2, path2);
    			append_dev(div7, t3);
    			append_dev(div7, div4);
    			append_dev(div4, button2);
    			append_dev(button2, svg3);
    			append_dev(svg3, path3);
    			append_dev(div7, t4);
    			append_dev(div7, div5);
    			append_dev(div5, span3);
    			append_dev(span3, span2);
    			append_dev(div7, t5);
    			append_dev(div7, div6);
    			append_dev(div6, button3);
    			append_dev(button3, svg4);
    			append_dev(svg4, path4);
    			append_dev(div18, t6);
    			append_dev(div18, div17);
    			append_dev(div17, div16);
    			append_dev(div16, div9);
    			append_dev(div9, button4);
    			append_dev(button4, svg5);
    			append_dev(svg5, path5);
    			append_dev(div16, t7);
    			append_dev(div16, div10);
    			append_dev(div10, span5);
    			append_dev(span5, span4);
    			append_dev(div16, t8);
    			append_dev(div16, div11);
    			append_dev(div11, button5);
    			append_dev(button5, svg6);
    			append_dev(svg6, path6);
    			append_dev(div16, t9);
    			append_dev(div16, div12);
    			append_dev(div12, svg7);
    			append_dev(svg7, path7);
    			append_dev(div16, t10);
    			append_dev(div16, div13);
    			append_dev(div13, button6);
    			append_dev(button6, svg8);
    			append_dev(svg8, path8);
    			append_dev(div16, t11);
    			append_dev(div16, div14);
    			append_dev(div14, span7);
    			append_dev(span7, span6);
    			append_dev(div16, t12);
    			append_dev(div16, div15);
    			append_dev(div15, button7);
    			append_dev(button7, svg9);
    			append_dev(svg9, path9);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, span9, anchor);
    			append_dev(span9, span8);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, button8, anchor);
    			append_dev(button8, svg10);
    			append_dev(svg10, path10);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*upperScorePlus*/ ctx[6], false, false, false),
    					listen_dev(button1, "click", /*upperScoreMinus*/ ctx[7], false, false, false),
    					listen_dev(button2, "click", /*upperFailPlus*/ ctx[10], false, false, false),
    					listen_dev(button3, "click", /*upperFailMinus*/ ctx[11], false, false, false),
    					listen_dev(button4, "click", /*lowerScorePlus*/ ctx[8], false, false, false),
    					listen_dev(button5, "click", /*lowerScoreMinus*/ ctx[9], false, false, false),
    					listen_dev(button6, "click", /*lowerFailPlus*/ ctx[12], false, false, false),
    					listen_dev(button7, "click", /*lowerFailMinus*/ ctx[13], false, false, false),
    					listen_dev(button8, "click", /*backButton*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*autoUpperScoreValue*/ 2) {
    				set_style(span0, "--value", /*autoUpperScoreValue*/ ctx[1]);
    			}

    			if (dirty[0] & /*autoUpperFailValue*/ 4) {
    				set_style(span2, "--value", /*autoUpperFailValue*/ ctx[2]);
    			}

    			if (dirty[0] & /*autoLowerScoreValue*/ 8) {
    				set_style(span4, "--value", /*autoLowerScoreValue*/ ctx[3]);
    			}

    			if (dirty[0] & /*autoLowerFailValue*/ 16) {
    				set_style(span6, "--value", /*autoLowerFailValue*/ ctx[4]);
    			}

    			if (dirty[0] & /*elapsed*/ 1) {
    				set_style(span8, "--value", parseInt(/*duration*/ ctx[5] / 1000 - /*elapsed*/ ctx[0] / 1000 + 0.99));
    			}
    		},
    		i: function intro(local) {
    			if (!div18_intro) {
    				add_render_callback(() => {
    					div18_intro = create_in_transition(div18, fade, { duration: 800 });
    					div18_intro.start();
    				});
    			}

    			if (!span9_intro) {
    				add_render_callback(() => {
    					span9_intro = create_in_transition(span9, fly, { y: -50, duration: 500 });
    					span9_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div18);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(span9);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(button8);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $autoNotif;
    	validate_store(autoNotif, 'autoNotif');
    	component_subscribe($$self, autoNotif, $$value => $$invalidate(21, $autoNotif = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AutoScoutControls', slots, []);
    	let elapsed = 0;
    	let duration = 15000;
    	let alertDuration = 25000;
    	let countDownElapsed = false;
    	let matchStageValue;
    	let last_time = window.performance.now();
    	let frame;
    	let hasUpdatedAttention = false;
    	let attentionAlertValue;

    	const attentionAlertSubscription = attentionAlert.subscribe(value => {
    		attentionAlertValue = value;
    	});

    	let autoModeValue;
    	let autoUpperScoreValue;
    	let autoUpperFailValue;
    	let autoLowerScoreValue;
    	let autoLowerFailValue;
    	let autoStageValue;

    	const autoStageSub = autoStage.subscribe(value => {
    		autoStageValue = value;
    	});

    	const autoUpperScoreSub = autoUpperScore.subscribe(value => {
    		$$invalidate(1, autoUpperScoreValue = value);
    	});

    	const autoUpperFailSub = autoUpperFail.subscribe(value => {
    		$$invalidate(2, autoUpperFailValue = value);
    	});

    	const autoLowerScoreSub = autoLowerScore.subscribe(value => {
    		$$invalidate(3, autoLowerScoreValue = value);
    	});

    	const autoLowerFailSub = autoLowerFail.subscribe(value => {
    		$$invalidate(4, autoLowerFailValue = value);
    	});

    	const matchStageSub = matchStage.subscribe(value => {
    		matchStageValue = value;
    	});

    	function upperScorePlus() {
    		autoUpperScore.update(n => n + 1);
    	}

    	function upperScoreMinus() {
    		autoUpperScore.update(n => n - 1);
    	}

    	function lowerScorePlus() {
    		autoLowerScore.update(n => n + 1);
    	}

    	function lowerScoreMinus() {
    		autoLowerScore.update(n => n - 1);
    	}

    	function upperFailPlus() {
    		autoUpperFail.update(n => n + 1);
    	}

    	function upperFailMinus() {
    		autoUpperFail.update(n => n - 1);
    	}

    	function lowerFailPlus() {
    		autoLowerFail.update(n => n + 1);
    	}

    	function lowerFailMinus() {
    		autoLowerFail.update(n => n - 1);
    	}

    	(function update() {
    		frame = requestAnimationFrame(update);
    		const time = window.performance.now();
    		$$invalidate(0, elapsed += time - last_time);
    		last_time = time;

    		if (elapsed >= alertDuration && !$autoNotif && matchStageValue === 1 && autoStageValue === 2) {
    			attentionAlert.update(n => true);
    			autoNotif.update(n => true);
    		}

    		if (elapsed >= alertDuration && !$autoNotif && (matchStageValue !== 1 || autoStageValue !== 2)) {
    			$$invalidate(0, elapsed = 0);
    		}

    		countDownElapsed = elapsed >= alertDuration;
    	})();

    	function backButton() {
    		autoStage.update(n => n - 1);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AutoScoutControls> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		attentionAlert,
    		matchStage,
    		autoNotif,
    		fade,
    		fly,
    		autoStage,
    		autoUpperScore,
    		autoUpperFail,
    		autoLowerFail,
    		autoLowerScore,
    		elapsed,
    		duration,
    		alertDuration,
    		countDownElapsed,
    		matchStageValue,
    		last_time,
    		frame,
    		hasUpdatedAttention,
    		attentionAlertValue,
    		attentionAlertSubscription,
    		autoModeValue,
    		autoUpperScoreValue,
    		autoUpperFailValue,
    		autoLowerScoreValue,
    		autoLowerFailValue,
    		autoStageValue,
    		autoStageSub,
    		autoUpperScoreSub,
    		autoUpperFailSub,
    		autoLowerScoreSub,
    		autoLowerFailSub,
    		matchStageSub,
    		upperScorePlus,
    		upperScoreMinus,
    		lowerScorePlus,
    		lowerScoreMinus,
    		upperFailPlus,
    		upperFailMinus,
    		lowerFailPlus,
    		lowerFailMinus,
    		backButton,
    		$autoNotif
    	});

    	$$self.$inject_state = $$props => {
    		if ('elapsed' in $$props) $$invalidate(0, elapsed = $$props.elapsed);
    		if ('duration' in $$props) $$invalidate(5, duration = $$props.duration);
    		if ('alertDuration' in $$props) alertDuration = $$props.alertDuration;
    		if ('countDownElapsed' in $$props) countDownElapsed = $$props.countDownElapsed;
    		if ('matchStageValue' in $$props) matchStageValue = $$props.matchStageValue;
    		if ('last_time' in $$props) last_time = $$props.last_time;
    		if ('frame' in $$props) frame = $$props.frame;
    		if ('hasUpdatedAttention' in $$props) hasUpdatedAttention = $$props.hasUpdatedAttention;
    		if ('attentionAlertValue' in $$props) attentionAlertValue = $$props.attentionAlertValue;
    		if ('autoModeValue' in $$props) autoModeValue = $$props.autoModeValue;
    		if ('autoUpperScoreValue' in $$props) $$invalidate(1, autoUpperScoreValue = $$props.autoUpperScoreValue);
    		if ('autoUpperFailValue' in $$props) $$invalidate(2, autoUpperFailValue = $$props.autoUpperFailValue);
    		if ('autoLowerScoreValue' in $$props) $$invalidate(3, autoLowerScoreValue = $$props.autoLowerScoreValue);
    		if ('autoLowerFailValue' in $$props) $$invalidate(4, autoLowerFailValue = $$props.autoLowerFailValue);
    		if ('autoStageValue' in $$props) autoStageValue = $$props.autoStageValue;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		elapsed,
    		autoUpperScoreValue,
    		autoUpperFailValue,
    		autoLowerScoreValue,
    		autoLowerFailValue,
    		duration,
    		upperScorePlus,
    		upperScoreMinus,
    		lowerScorePlus,
    		lowerScoreMinus,
    		upperFailPlus,
    		upperFailMinus,
    		lowerFailPlus,
    		lowerFailMinus,
    		backButton
    	];
    }

    class AutoScoutControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AutoScoutControls",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\AutoScoutSpecific.svelte generated by Svelte v3.48.0 */
    const file$9 = "src\\AutoScoutSpecific.svelte";

    // (19:0) {:else}
    function create_else_block$4(ctx) {
    	let button;
    	let svg;
    	let defs;
    	let style;
    	let t0;
    	let title;
    	let t1;
    	let path;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			style = svg_element("style");
    			t0 = text(".cls-1{fill-rule:evenodd;}\n");
    			title = svg_element("title");
    			t1 = text("taxi-cab");
    			path = svg_element("path");
    			add_location(style, file$9, 20, 168, 1992);
    			add_location(defs, file$9, 20, 162, 1986);
    			add_location(title, file$9, 21, 15, 2041);
    			attr_dev(path, "class", "cls-1");
    			attr_dev(path, "d", "M10.17,55.2c-11-5.58-9.72-11.8,1.31-11.15L14,48.68,19,32.85c1.66-5.18,4.25-10,8.83-11.42V5.57A5.58,5.58,0,0,1,33.44,0h56A5.58,5.58,0,0,1,95,5.57V21h1c6.53,0,10.29,5.54,11.87,11.87l3.82,15.35,2.2-4.14c11.34-.66,12.35,5.93.35,11.62l2,3c7.89,8.11,7.15,16.21,5.92,36.24v6.58a3.72,3.72,0,0,1-3.71,3.71H102.57a3.72,3.72,0,0,1-3.71-3.71v-3H24v3a3.72,3.72,0,0,1-3.71,3.71H4.5a3.72,3.72,0,0,1-3.71-3.71V92.93a5.46,5.46,0,0,1,0-.58C-.37,77-2.06,63.12,10.17,55.2ZM39.57,21h5V9.75h3.66v-4H35.91v4h3.66V21Zm8.73,0h5.31l.46-2h4.16l.46,2H64l-4-15.25h-7.8L48.3,21ZM65,21h5.34L72,17h.23l1.68,4h5.59l-3.28-7.63,3.51-7.62H74.24L72.5,9.93h-.25L70.51,5.72H64.78l3.43,7.77L65,21Zm16.92,0h5V5.72h-5V21Zm7.72,6.23H33.06c-5,0-7.52,4.31-9,9.05L19.23,52.17v0h86.82l-3.83-15.92c-1-4.85-4.07-9-9-9ZM56,10.56,55,15H57.3l-1-4.42ZM30.38,73.43,16.32,71.66c-3.32-.37-4.21,1-3.08,3.89l1.52,3.69a5.33,5.33,0,0,0,1.9,2.12,6.43,6.43,0,0,0,3.15.87l12.54.1c3,0,4.34-1.22,3.39-4a6.78,6.78,0,0,0-5.36-4.9Zm62.12,0,14.06-1.77c3.32-.37,4.21,1,3.08,3.89l-1.52,3.69a5.33,5.33,0,0,1-1.9,2.12,6.43,6.43,0,0,1-3.15.87l-12.54.1c-3,0-4.34-1.22-3.39-4a6.78,6.78,0,0,1,5.36-4.9Z");
    			add_location(path, file$9, 21, 38, 2064);
    			attr_dev(svg, "id", "Layer_1");
    			attr_dev(svg, "data-name", "Layer 1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "90");
    			attr_dev(svg, "viewBox", "0 0 122.88 105.19");
    			add_location(svg, file$9, 20, 8, 1832);
    			attr_dev(button, "class", "btn btn-success btn-square btn-outline w-72 h-24 ml-32 mt-7");
    			add_location(button, file$9, 19, 4, 1723);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, defs);
    			append_dev(defs, style);
    			append_dev(style, t0);
    			append_dev(svg, title);
    			append_dev(title, t1);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*shiftTaxi*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(19:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:0) {#if !taxiValue}
    function create_if_block$4(ctx) {
    	let button;
    	let svg;
    	let defs;
    	let style;
    	let t0;
    	let title;
    	let t1;
    	let path;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			style = svg_element("style");
    			t0 = text(".cls-1{fill-rule:evenodd;}\n");
    			title = svg_element("title");
    			t1 = text("taxi-cab");
    			path = svg_element("path");
    			add_location(style, file$9, 15, 164, 468);
    			add_location(defs, file$9, 15, 158, 462);
    			add_location(title, file$9, 16, 15, 517);
    			attr_dev(path, "class", "cls-1");
    			attr_dev(path, "d", "M10.17,55.2c-11-5.58-9.72-11.8,1.31-11.15L14,48.68,19,32.85c1.66-5.18,4.25-10,8.83-11.42V5.57A5.58,5.58,0,0,1,33.44,0h56A5.58,5.58,0,0,1,95,5.57V21h1c6.53,0,10.29,5.54,11.87,11.87l3.82,15.35,2.2-4.14c11.34-.66,12.35,5.93.35,11.62l2,3c7.89,8.11,7.15,16.21,5.92,36.24v6.58a3.72,3.72,0,0,1-3.71,3.71H102.57a3.72,3.72,0,0,1-3.71-3.71v-3H24v3a3.72,3.72,0,0,1-3.71,3.71H4.5a3.72,3.72,0,0,1-3.71-3.71V92.93a5.46,5.46,0,0,1,0-.58C-.37,77-2.06,63.12,10.17,55.2ZM39.57,21h5V9.75h3.66v-4H35.91v4h3.66V21Zm8.73,0h5.31l.46-2h4.16l.46,2H64l-4-15.25h-7.8L48.3,21ZM65,21h5.34L72,17h.23l1.68,4h5.59l-3.28-7.63,3.51-7.62H74.24L72.5,9.93h-.25L70.51,5.72H64.78l3.43,7.77L65,21Zm16.92,0h5V5.72h-5V21Zm7.72,6.23H33.06c-5,0-7.52,4.31-9,9.05L19.23,52.17v0h86.82l-3.83-15.92c-1-4.85-4.07-9-9-9ZM56,10.56,55,15H57.3l-1-4.42ZM30.38,73.43,16.32,71.66c-3.32-.37-4.21,1-3.08,3.89l1.52,3.69a5.33,5.33,0,0,0,1.9,2.12,6.43,6.43,0,0,0,3.15.87l12.54.1c3,0,4.34-1.22,3.39-4a6.78,6.78,0,0,0-5.36-4.9Zm62.12,0,14.06-1.77c3.32-.37,4.21,1,3.08,3.89l-1.52,3.69a5.33,5.33,0,0,1-1.9,2.12,6.43,6.43,0,0,1-3.15.87l-12.54.1c-3,0-4.34-1.22-3.39-4a6.78,6.78,0,0,1,5.36-4.9Z");
    			add_location(path, file$9, 16, 38, 540);
    			attr_dev(svg, "id", "Layer_1");
    			attr_dev(svg, "data-name", "Layer 1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "70");
    			attr_dev(svg, "viewBox", "0 0 122.88 105.19");
    			add_location(svg, file$9, 15, 4, 308);
    			attr_dev(button, "class", "btn btn-error btn-square btn-outline w-72 h-24 ml-32 mt-7");
    			add_location(button, file$9, 14, 0, 205);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, defs);
    			append_dev(defs, style);
    			append_dev(style, t0);
    			append_dev(svg, title);
    			append_dev(title, t1);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*shiftTaxi*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(14:0) {#if !taxiValue}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (!/*taxiValue*/ ctx[0]) return create_if_block$4;
    		return create_else_block$4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $taxi;
    	validate_store(taxi, 'taxi');
    	component_subscribe($$self, taxi, $$value => $$invalidate(2, $taxi = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AutoScoutSpecific', slots, []);
    	let taxiValue = $taxi;

    	function shiftTaxi() {
    		$$invalidate(0, taxiValue = !taxiValue);
    		taxi.update(n => !n);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AutoScoutSpecific> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ taxi, taxiValue, shiftTaxi, $taxi });

    	$$self.$inject_state = $$props => {
    		if ('taxiValue' in $$props) $$invalidate(0, taxiValue = $$props.taxiValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [taxiValue, shiftTaxi];
    }

    class AutoScoutSpecific extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AutoScoutSpecific",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z$2 = "main.svelte-11acm5v{overflow-x:auto}";
    styleInject(css_248z$2);

    /* src\AutoScout.svelte generated by Svelte v3.48.0 */
    const file$8 = "src\\AutoScout.svelte";

    function create_fragment$9(ctx) {
    	let main;
    	let div2;
    	let div0;
    	let autoscoutcontrols;
    	let t;
    	let div1;
    	let autoscoutdisplay;
    	let current;
    	autoscoutcontrols = new AutoScoutControls({ $$inline: true });
    	autoscoutdisplay = new AutoScoutSpecific({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			create_component(autoscoutcontrols.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(autoscoutdisplay.$$.fragment);
    			attr_dev(div0, "class", "box row-start-1 row-span-1 col-start-1 col-span-1");
    			add_location(div0, file$8, 8, 2, 287);
    			attr_dev(div1, "class", "box row-start-1 row-end-2 col-start-2 col-span-1 absolute");
    			add_location(div1, file$8, 12, 2, 392);
    			attr_dev(div2, "class", "grid overflow-hidden grid-cols-2 grid-rows-1 gap-2 w-full h-full fixed");
    			add_location(div2, file$8, 7, 0, 199);
    			set_style(main, "overflow", "hidden");
    			attr_dev(main, "class", "svelte-11acm5v");
    			add_location(main, file$8, 6, 0, 166);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			mount_component(autoscoutcontrols, div0, null);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			mount_component(autoscoutdisplay, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(autoscoutcontrols.$$.fragment, local);
    			transition_in(autoscoutdisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(autoscoutcontrols.$$.fragment, local);
    			transition_out(autoscoutdisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(autoscoutcontrols);
    			destroy_component(autoscoutdisplay);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AutoScout', slots, []);
    	let temp = true;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AutoScout> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		AutoScoutControls,
    		AutoScoutDisplay: AutoScoutSpecific,
    		temp
    	});

    	$$self.$inject_state = $$props => {
    		if ('temp' in $$props) temp = $$props.temp;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class AutoScout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AutoScout",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\AutoManager.svelte generated by Svelte v3.48.0 */

    // (18:4) {:else}
    function create_else_block$3(ctx) {
    	let autoscout;
    	let current;
    	autoscout = new AutoScout({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(autoscout.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(autoscout, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(autoscout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(autoscout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(autoscout, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(18:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (16:0) {#if stage===1}
    function create_if_block$3(ctx) {
    	let autolobby;
    	let current;
    	autolobby = new AutoLobby({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(autolobby.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(autolobby, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(autolobby.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(autolobby.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(autolobby, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(16:0) {#if stage===1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*stage*/ ctx[0] === 1) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AutoManager', slots, []);
    	let stage;

    	const autoStageSub = autoStage.subscribe(value => {
    		$$invalidate(0, stage = value);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AutoManager> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		AutoLobby,
    		AutoScout,
    		autoStage,
    		stage,
    		autoStageSub
    	});

    	$$self.$inject_state = $$props => {
    		if ('stage' in $$props) $$invalidate(0, stage = $$props.stage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [stage];
    }

    class AutoManager extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AutoManager",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\TeleScoutControls.svelte generated by Svelte v3.48.0 */

    const file$7 = "src\\TeleScoutControls.svelte";

    function create_fragment$7(ctx) {
    	let div18;
    	let div8;
    	let div7;
    	let div0;
    	let button0;
    	let svg0;
    	let path0;
    	let t0;
    	let div1;
    	let span1;
    	let span0;
    	let t1;
    	let div2;
    	let button1;
    	let svg1;
    	let path1;
    	let t2;
    	let div3;
    	let svg2;
    	let path2;
    	let t3;
    	let div4;
    	let button2;
    	let svg3;
    	let path3;
    	let t4;
    	let div5;
    	let span3;
    	let span2;
    	let t5;
    	let div6;
    	let button3;
    	let svg4;
    	let path4;
    	let t6;
    	let div17;
    	let div16;
    	let div9;
    	let button4;
    	let svg5;
    	let path5;
    	let t7;
    	let div10;
    	let span5;
    	let span4;
    	let t8;
    	let div11;
    	let button5;
    	let svg6;
    	let path6;
    	let t9;
    	let div12;
    	let svg7;
    	let path7;
    	let t10;
    	let div13;
    	let button6;
    	let svg8;
    	let path8;
    	let t11;
    	let div14;
    	let span7;
    	let span6;
    	let t12;
    	let div15;
    	let button7;
    	let svg9;
    	let path9;
    	let div18_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div18 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span0 = element("span");
    			t1 = space();
    			div2 = element("div");
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t2 = space();
    			div3 = element("div");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t3 = space();
    			div4 = element("div");
    			button2 = element("button");
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			t4 = space();
    			div5 = element("div");
    			span3 = element("span");
    			span2 = element("span");
    			t5 = space();
    			div6 = element("div");
    			button3 = element("button");
    			svg4 = svg_element("svg");
    			path4 = svg_element("path");
    			t6 = space();
    			div17 = element("div");
    			div16 = element("div");
    			div9 = element("div");
    			button4 = element("button");
    			svg5 = svg_element("svg");
    			path5 = svg_element("path");
    			t7 = space();
    			div10 = element("div");
    			span5 = element("span");
    			span4 = element("span");
    			t8 = space();
    			div11 = element("div");
    			button5 = element("button");
    			svg6 = svg_element("svg");
    			path6 = svg_element("path");
    			t9 = space();
    			div12 = element("div");
    			svg7 = svg_element("svg");
    			path7 = svg_element("path");
    			t10 = space();
    			div13 = element("div");
    			button6 = element("button");
    			svg8 = svg_element("svg");
    			path8 = svg_element("path");
    			t11 = space();
    			div14 = element("div");
    			span7 = element("span");
    			span6 = element("span");
    			t12 = space();
    			div15 = element("div");
    			button7 = element("button");
    			svg9 = svg_element("svg");
    			path9 = svg_element("path");
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "stroke-width", "3");
    			attr_dev(path0, "d", "M12 4v16m8-8H4");
    			add_location(path0, file$7, 84, 143, 2472);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 39 39");
    			attr_dev(svg0, "stroke", "currentColor");
    			add_location(svg0, file$7, 84, 20, 2349);
    			attr_dev(button0, "class", "btn btn-success btn-square btn-outline w-36 h-24");
    			add_location(button0, file$7, 83, 16, 2234);
    			attr_dev(div0, "class", "box row-start-1 row-span-1 col-start-1 col-span-1 absolute z-20");
    			add_location(div0, file$7, 81, 12, 2086);
    			set_style(span0, "--value", /*teleUpperScoreValue*/ ctx[0]);
    			add_location(span0, file$7, 90, 2, 2845);
    			attr_dev(span1, "class", "countdown text-5xl ml-11 mt-3 font-bold");
    			add_location(span1, file$7, 89, 16, 2787);
    			attr_dev(div1, "class", "box row-start-2 row-span-1 col-start-1 col-span-1 content-center z-10");
    			add_location(div1, file$7, 87, 12, 2630);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "3");
    			attr_dev(path1, "d", "M20 12H4");
    			add_location(path1, file$7, 96, 143, 3325);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 39 39");
    			attr_dev(svg1, "stroke", "currentColor");
    			add_location(svg1, file$7, 96, 20, 3202);
    			attr_dev(button1, "class", "btn btn-success btn-square btn-outline w-36 h-24 -mt-5");
    			add_location(button1, file$7, 95, 16, 3081);
    			attr_dev(div2, "class", "box row-start-3 row-span-1 col-start-1 col-span-1 z-30");
    			add_location(div2, file$7, 93, 12, 2940);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "stroke-width", "3");
    			attr_dev(path2, "d", "M8 7l4-4m0 0l4 4m-4-4v18");
    			add_location(path2, file$7, 101, 140, 3730);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "class", "h-24 w-24 ml-6 mt-20");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "viewBox", "0 0 28 28");
    			attr_dev(svg2, "stroke", "currentColor");
    			add_location(svg2, file$7, 101, 16, 3606);
    			attr_dev(div3, "class", "box row-start-1 row-span-3 col-start-2 col-span-1");
    			add_location(div3, file$7, 99, 12, 3477);
    			attr_dev(path3, "stroke-linecap", "round");
    			attr_dev(path3, "stroke-linejoin", "round");
    			attr_dev(path3, "stroke-width", "3");
    			attr_dev(path3, "d", "M12 4v16m8-8H4");
    			add_location(path3, file$7, 106, 143, 4249);
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "viewBox", "0 0 39 39");
    			attr_dev(svg3, "stroke", "currentColor");
    			add_location(svg3, file$7, 106, 20, 4126);
    			attr_dev(button2, "class", "btn btn-error btn-square btn-outline w-36 h-24 -ml-3");
    			add_location(button2, file$7, 105, 16, 4010);
    			attr_dev(div4, "class", "box row-start-1 row-span-1 col-start-3 col-span-1 z-20");
    			add_location(div4, file$7, 103, 12, 3871);
    			set_style(span2, "--value", /*teleUpperFailValue*/ ctx[1]);
    			add_location(span2, file$7, 112, 2, 4604);
    			attr_dev(span3, "class", "countdown text-5xl ml-8 mt-3 font-bold");
    			add_location(span3, file$7, 111, 16, 4547);
    			attr_dev(div5, "class", "box row-start-2 row-span-1 col-start-3 col-span-1 z-10");
    			add_location(div5, file$7, 109, 12, 4407);
    			attr_dev(path4, "stroke-linecap", "round");
    			attr_dev(path4, "stroke-linejoin", "round");
    			attr_dev(path4, "stroke-width", "3");
    			attr_dev(path4, "d", "M20 12H4");
    			add_location(path4, file$7, 118, 143, 5084);
    			attr_dev(svg4, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg4, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg4, "fill", "none");
    			attr_dev(svg4, "viewBox", "0 0 39 39");
    			attr_dev(svg4, "stroke", "currentColor");
    			add_location(svg4, file$7, 118, 20, 4961);
    			attr_dev(button3, "class", "btn btn-error btn-square btn-outline w-36 h-24 -ml-3 -mt-5");
    			add_location(button3, file$7, 117, 16, 4838);
    			attr_dev(div6, "class", "box row-start-3 row-span-1 col-start-3 col-span-1 z-30");
    			add_location(div6, file$7, 115, 12, 4698);
    			attr_dev(div7, "class", "grid grid-cols-3 grid-rows-3 gap-2 w-2/5 h-2/5 absolute ml-36 mt-1");
    			add_location(div7, file$7, 80, 8, 1991);
    			attr_dev(div8, "class", "box row-start-1 row-span-1 col-start-1 col-span-1");
    			add_location(div8, file$7, 73, 4, 1906);
    			attr_dev(path5, "stroke-linecap", "round");
    			attr_dev(path5, "stroke-linejoin", "round");
    			attr_dev(path5, "stroke-width", "3");
    			attr_dev(path5, "d", "M12 4v16m8-8H4");
    			add_location(path5, file$7, 137, 143, 5838);
    			attr_dev(svg5, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg5, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg5, "fill", "none");
    			attr_dev(svg5, "viewBox", "0 0 39 39");
    			attr_dev(svg5, "stroke", "currentColor");
    			add_location(svg5, file$7, 137, 20, 5715);
    			attr_dev(button4, "class", "btn btn-success btn-square btn-outline w-36 h-24");
    			add_location(button4, file$7, 136, 16, 5602);
    			attr_dev(div9, "class", "box row-start-1 row-span-1 col-start-1 col-span-1 absolute z-20");
    			add_location(div9, file$7, 134, 12, 5454);
    			set_style(span4, "--value", /*teleLowerScoreValue*/ ctx[2]);
    			add_location(span4, file$7, 143, 2, 6195);
    			attr_dev(span5, "class", "countdown text-5xl ml-11 mt-3 font-bold");
    			add_location(span5, file$7, 142, 16, 6137);
    			attr_dev(div10, "class", "box row-start-2 row-span-1 col-start-1 col-span-1 z-10");
    			add_location(div10, file$7, 140, 12, 5996);
    			attr_dev(path6, "stroke-linecap", "round");
    			attr_dev(path6, "stroke-linejoin", "round");
    			attr_dev(path6, "stroke-width", "3");
    			attr_dev(path6, "d", "M20 12H4");
    			add_location(path6, file$7, 149, 143, 6674);
    			attr_dev(svg6, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg6, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg6, "fill", "none");
    			attr_dev(svg6, "viewBox", "0 0 39 39");
    			attr_dev(svg6, "stroke", "currentColor");
    			add_location(svg6, file$7, 149, 20, 6551);
    			attr_dev(button5, "class", "btn btn-success btn-square btn-outline w-36 h-24 -mt-5");
    			add_location(button5, file$7, 148, 16, 6431);
    			attr_dev(div11, "class", "box row-start-3 row-span-1 col-start-1 col-span-1 z-30");
    			add_location(div11, file$7, 146, 12, 6290);
    			attr_dev(path7, "stroke-linecap", "round");
    			attr_dev(path7, "stroke-linejoin", "round");
    			attr_dev(path7, "stroke-width", "3");
    			attr_dev(path7, "d", "M16 17l-4 4m0 0l-4-4m4 4V3");
    			add_location(path7, file$7, 154, 140, 7079);
    			attr_dev(svg7, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg7, "class", "h-24 w-24 ml-6 mt-20");
    			attr_dev(svg7, "fill", "none");
    			attr_dev(svg7, "viewBox", "0 0 28 28");
    			attr_dev(svg7, "stroke", "currentColor");
    			add_location(svg7, file$7, 154, 16, 6955);
    			attr_dev(div12, "class", "box row-start-1 row-span-3 col-start-2 col-span-1");
    			add_location(div12, file$7, 152, 12, 6826);
    			attr_dev(path8, "stroke-linecap", "round");
    			attr_dev(path8, "stroke-linejoin", "round");
    			attr_dev(path8, "stroke-width", "3");
    			attr_dev(path8, "d", "M12 4v16m8-8H4");
    			add_location(path8, file$7, 159, 143, 7599);
    			attr_dev(svg8, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg8, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg8, "fill", "none");
    			attr_dev(svg8, "viewBox", "0 0 39 39");
    			attr_dev(svg8, "stroke", "currentColor");
    			add_location(svg8, file$7, 159, 20, 7476);
    			attr_dev(button6, "class", "btn btn-error btn-square btn-outline w-36 h-24 -ml-3");
    			add_location(button6, file$7, 158, 16, 7360);
    			attr_dev(div13, "class", "box row-start-1 row-span-1 col-start-3 col-span-1 z-20");
    			add_location(div13, file$7, 156, 12, 7222);
    			set_style(span6, "--value", /*teleLowerFailValue*/ ctx[3]);
    			add_location(span6, file$7, 165, 2, 7954);
    			attr_dev(span7, "class", "countdown text-5xl ml-8 mt-3 font-bold");
    			add_location(span7, file$7, 164, 16, 7897);
    			attr_dev(div14, "class", "box row-start-2 row-span-1 col-start-3 col-span-1 z-10");
    			add_location(div14, file$7, 162, 12, 7757);
    			attr_dev(path9, "stroke-linecap", "round");
    			attr_dev(path9, "stroke-linejoin", "round");
    			attr_dev(path9, "stroke-width", "3");
    			attr_dev(path9, "d", "M20 12H4");
    			add_location(path9, file$7, 171, 143, 8434);
    			attr_dev(svg9, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg9, "class", "h-24 w-24 ml-9 mt-4");
    			attr_dev(svg9, "fill", "none");
    			attr_dev(svg9, "viewBox", "0 0 39 39");
    			attr_dev(svg9, "stroke", "currentColor");
    			add_location(svg9, file$7, 171, 20, 8311);
    			attr_dev(button7, "class", "btn btn-error btn-square btn-outline w-36 h-24 -ml-3 -mt-5");
    			add_location(button7, file$7, 170, 16, 8188);
    			attr_dev(div15, "class", "box row-start-3 row-span-1 col-start-3 col-span-1 z-30");
    			add_location(div15, file$7, 168, 12, 8048);
    			attr_dev(div16, "class", "grid grid-cols-3 grid-rows-3 gap-2 w-2/5 h-2/5 absolute ml-36 -mt-9");
    			add_location(div16, file$7, 133, 8, 5358);
    			attr_dev(div17, "class", "box row-start-2 row-span-1 col-start-1 col-span-1 -mt-[10px]");
    			add_location(div17, file$7, 127, 4, 5264);
    			attr_dev(div18, "class", "grid grid-cols-1 grid-rows-2 gap-2 w-full h-full absolute ");
    			add_location(div18, file$7, 72, 0, 1800);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div18, anchor);
    			append_dev(div18, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div0);
    			append_dev(div0, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div7, t0);
    			append_dev(div7, div1);
    			append_dev(div1, span1);
    			append_dev(span1, span0);
    			append_dev(div7, t1);
    			append_dev(div7, div2);
    			append_dev(div2, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(div7, t2);
    			append_dev(div7, div3);
    			append_dev(div3, svg2);
    			append_dev(svg2, path2);
    			append_dev(div7, t3);
    			append_dev(div7, div4);
    			append_dev(div4, button2);
    			append_dev(button2, svg3);
    			append_dev(svg3, path3);
    			append_dev(div7, t4);
    			append_dev(div7, div5);
    			append_dev(div5, span3);
    			append_dev(span3, span2);
    			append_dev(div7, t5);
    			append_dev(div7, div6);
    			append_dev(div6, button3);
    			append_dev(button3, svg4);
    			append_dev(svg4, path4);
    			append_dev(div18, t6);
    			append_dev(div18, div17);
    			append_dev(div17, div16);
    			append_dev(div16, div9);
    			append_dev(div9, button4);
    			append_dev(button4, svg5);
    			append_dev(svg5, path5);
    			append_dev(div16, t7);
    			append_dev(div16, div10);
    			append_dev(div10, span5);
    			append_dev(span5, span4);
    			append_dev(div16, t8);
    			append_dev(div16, div11);
    			append_dev(div11, button5);
    			append_dev(button5, svg6);
    			append_dev(svg6, path6);
    			append_dev(div16, t9);
    			append_dev(div16, div12);
    			append_dev(div12, svg7);
    			append_dev(svg7, path7);
    			append_dev(div16, t10);
    			append_dev(div16, div13);
    			append_dev(div13, button6);
    			append_dev(button6, svg8);
    			append_dev(svg8, path8);
    			append_dev(div16, t11);
    			append_dev(div16, div14);
    			append_dev(div14, span7);
    			append_dev(span7, span6);
    			append_dev(div16, t12);
    			append_dev(div16, div15);
    			append_dev(div15, button7);
    			append_dev(button7, svg9);
    			append_dev(svg9, path9);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*upperScorePlus*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*upperScoreMinus*/ ctx[5], false, false, false),
    					listen_dev(button2, "click", /*upperFailPlus*/ ctx[8], false, false, false),
    					listen_dev(button3, "click", /*upperFailMinus*/ ctx[9], false, false, false),
    					listen_dev(button4, "click", /*lowerScorePlus*/ ctx[6], false, false, false),
    					listen_dev(button5, "click", /*lowerScoreMinus*/ ctx[7], false, false, false),
    					listen_dev(button6, "click", /*lowerFailPlus*/ ctx[10], false, false, false),
    					listen_dev(button7, "click", /*lowerFailMinus*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*teleUpperScoreValue*/ 1) {
    				set_style(span0, "--value", /*teleUpperScoreValue*/ ctx[0]);
    			}

    			if (dirty & /*teleUpperFailValue*/ 2) {
    				set_style(span2, "--value", /*teleUpperFailValue*/ ctx[1]);
    			}

    			if (dirty & /*teleLowerScoreValue*/ 4) {
    				set_style(span4, "--value", /*teleLowerScoreValue*/ ctx[2]);
    			}

    			if (dirty & /*teleLowerFailValue*/ 8) {
    				set_style(span6, "--value", /*teleLowerFailValue*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (!div18_intro) {
    				add_render_callback(() => {
    					div18_intro = create_in_transition(div18, fade, { duration: 800 });
    					div18_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div18);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TeleScoutControls', slots, []);
    	let elapsed = 0;
    	let duration = 15000;
    	let alertDuration = 25000;
    	let countDownElapsed = false;
    	let last_time = window.performance.now();
    	let frame;
    	let hasUpdatedAttention = false;
    	let attentionAlertValue;

    	const attentionAlertSubscription = attentionAlert.subscribe(value => {
    		attentionAlertValue = value;
    	});

    	let teleUpperScoreValue;
    	let teleUpperFailValue;
    	let teleLowerScoreValue;
    	let teleLowerFailValue;

    	const teleUpperScoreSub = teleUpperScore.subscribe(value => {
    		$$invalidate(0, teleUpperScoreValue = value);
    	});

    	const teleoUpperFailSub = teleUpperFail.subscribe(value => {
    		$$invalidate(1, teleUpperFailValue = value);
    	});

    	const teleLowerScoreSub = teleLowerScore.subscribe(value => {
    		$$invalidate(2, teleLowerScoreValue = value);
    	});

    	const teleLowerFailSub = teleLowerFail.subscribe(value => {
    		$$invalidate(3, teleLowerFailValue = value);
    	});

    	function upperScorePlus() {
    		teleUpperScore.update(n => n + 1);
    	}

    	function upperScoreMinus() {
    		teleUpperScore.update(n => n - 1);
    	}

    	function lowerScorePlus() {
    		teleLowerScore.update(n => n + 1);
    	}

    	function lowerScoreMinus() {
    		teleLowerScore.update(n => n - 1);
    	}

    	function upperFailPlus() {
    		teleUpperFail.update(n => n + 1);
    	}

    	function upperFailMinus() {
    		teleUpperFail.update(n => n - 1);
    	}

    	function lowerFailPlus() {
    		teleLowerFail.update(n => n + 1);
    	}

    	function lowerFailMinus() {
    		teleLowerFail.update(n => n - 1);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TeleScoutControls> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		attentionAlert,
    		fade,
    		fly,
    		teleUpperScore,
    		teleUpperFail,
    		teleLowerFail,
    		teleLowerScore,
    		elapsed,
    		duration,
    		alertDuration,
    		countDownElapsed,
    		last_time,
    		frame,
    		hasUpdatedAttention,
    		attentionAlertValue,
    		attentionAlertSubscription,
    		teleUpperScoreValue,
    		teleUpperFailValue,
    		teleLowerScoreValue,
    		teleLowerFailValue,
    		teleUpperScoreSub,
    		teleoUpperFailSub,
    		teleLowerScoreSub,
    		teleLowerFailSub,
    		upperScorePlus,
    		upperScoreMinus,
    		lowerScorePlus,
    		lowerScoreMinus,
    		upperFailPlus,
    		upperFailMinus,
    		lowerFailPlus,
    		lowerFailMinus
    	});

    	$$self.$inject_state = $$props => {
    		if ('elapsed' in $$props) elapsed = $$props.elapsed;
    		if ('duration' in $$props) duration = $$props.duration;
    		if ('alertDuration' in $$props) alertDuration = $$props.alertDuration;
    		if ('countDownElapsed' in $$props) countDownElapsed = $$props.countDownElapsed;
    		if ('last_time' in $$props) last_time = $$props.last_time;
    		if ('frame' in $$props) frame = $$props.frame;
    		if ('hasUpdatedAttention' in $$props) hasUpdatedAttention = $$props.hasUpdatedAttention;
    		if ('attentionAlertValue' in $$props) attentionAlertValue = $$props.attentionAlertValue;
    		if ('teleUpperScoreValue' in $$props) $$invalidate(0, teleUpperScoreValue = $$props.teleUpperScoreValue);
    		if ('teleUpperFailValue' in $$props) $$invalidate(1, teleUpperFailValue = $$props.teleUpperFailValue);
    		if ('teleLowerScoreValue' in $$props) $$invalidate(2, teleLowerScoreValue = $$props.teleLowerScoreValue);
    		if ('teleLowerFailValue' in $$props) $$invalidate(3, teleLowerFailValue = $$props.teleLowerFailValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		teleUpperScoreValue,
    		teleUpperFailValue,
    		teleLowerScoreValue,
    		teleLowerFailValue,
    		upperScorePlus,
    		upperScoreMinus,
    		lowerScorePlus,
    		lowerScoreMinus,
    		upperFailPlus,
    		upperFailMinus,
    		lowerFailPlus,
    		lowerFailMinus
    	];
    }

    class TeleScoutControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TeleScoutControls",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\TeleScoutEndgame.svelte generated by Svelte v3.48.0 */
    const file$6 = "src\\TeleScoutEndgame.svelte";

    function create_fragment$6(ctx) {
    	let input0;
    	let t0;
    	let input1;
    	let t1;
    	let div;
    	let t2;
    	let br0;
    	let t3;
    	let br1;
    	let t4;
    	let br2;
    	let t5;
    	let br3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = space();
    			div = element("div");
    			t2 = text("Traverse");
    			br0 = element("br");
    			t3 = text("\r\n    High");
    			br1 = element("br");
    			t4 = text("\r\n    Mid");
    			br2 = element("br");
    			t5 = text("\r\n    Low");
    			br3 = element("br");
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", "0");
    			attr_dev(input0, "max", "4");
    			attr_dev(input0, "class", "range range-lg range-secondary -rotate-90 w-96 absolute ml-16 mt-60");
    			attr_dev(input0, "step", "1");
    			add_location(input0, file$6, 31, 0, 669);
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "0");
    			attr_dev(input1, "max", "4");
    			attr_dev(input1, "class", "range range-lg range-accent -rotate-90 w-96 absolute ml-40 mt-60");
    			attr_dev(input1, "step", "1");
    			add_location(input1, file$6, 32, 0, 817);
    			add_location(br0, file$6, 35, 12, 1046);
    			add_location(br1, file$6, 36, 8, 1060);
    			add_location(br2, file$6, 37, 7, 1073);
    			add_location(br3, file$6, 38, 7, 1086);
    			attr_dev(div, "class", "leading-[90px] font-bold text-xl ml-[382px] mt-[27px]");
    			add_location(div, file$6, 34, 0, 965);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*heightAtt*/ ctx[0]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*heightSucc*/ ctx[1]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, t2);
    			append_dev(div, br0);
    			append_dev(div, t3);
    			append_dev(div, br1);
    			append_dev(div, t4);
    			append_dev(div, br2);
    			append_dev(div, t5);
    			append_dev(div, br3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[2]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[2]),
    					listen_dev(input1, "change", /*input1_change_input_handler*/ ctx[3]),
    					listen_dev(input1, "input", /*input1_change_input_handler*/ ctx[3])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*heightAtt*/ 1) {
    				set_input_value(input0, /*heightAtt*/ ctx[0]);
    			}

    			if (dirty & /*heightSucc*/ 2) {
    				set_input_value(input1, /*heightSucc*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TeleScoutEndgame', slots, []);
    	let heightAtt = 0;
    	let heightSucc = 0;

    	function checkLevels() {
    		if (heightSucc > heightAtt) {
    			$$invalidate(0, heightAtt = heightSucc);
    		}

    		climbAttemptLevel.update(n => heightAtt);
    		climbSuccessLevel.update(n => heightSucc);
    	}

    	const attemptSub = climbAttemptLevel.subscribe(value => {
    		$$invalidate(0, heightAtt = value);
    	});

    	const successSub = climbSuccessLevel.subscribe(value => {
    		$$invalidate(1, heightSucc = value);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TeleScoutEndgame> was created with unknown prop '${key}'`);
    	});

    	function input0_change_input_handler() {
    		heightAtt = to_number(this.value);
    		$$invalidate(0, heightAtt);
    	}

    	function input1_change_input_handler() {
    		heightSucc = to_number(this.value);
    		$$invalidate(1, heightSucc);
    	}

    	$$self.$capture_state = () => ({
    		climbAttemptLevel,
    		climbSuccessLevel,
    		teleUpperScore,
    		heightAtt,
    		heightSucc,
    		checkLevels,
    		attemptSub,
    		successSub
    	});

    	$$self.$inject_state = $$props => {
    		if ('heightAtt' in $$props) $$invalidate(0, heightAtt = $$props.heightAtt);
    		if ('heightSucc' in $$props) $$invalidate(1, heightSucc = $$props.heightSucc);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*heightAtt, heightSucc*/ 3) {
    			{
    				checkLevels();
    				checkLevels();
    			}
    		}
    	};

    	return [
    		heightAtt,
    		heightSucc,
    		input0_change_input_handler,
    		input1_change_input_handler
    	];
    }

    class TeleScoutEndgame extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TeleScoutEndgame",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\TeleScout.svelte generated by Svelte v3.48.0 */
    const file$5 = "src\\TeleScout.svelte";

    function create_fragment$5(ctx) {
    	let div2;
    	let div0;
    	let telescoutcontrols;
    	let t;
    	let div1;
    	let telescoutendgame;
    	let current;
    	telescoutcontrols = new TeleScoutControls({ $$inline: true });
    	telescoutendgame = new TeleScoutEndgame({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(telescoutcontrols.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(telescoutendgame.$$.fragment);
    			attr_dev(div0, "class", "box row-start-1 row-span-1 col-start-1 col-span-1");
    			add_location(div0, file$5, 6, 4, 241);
    			attr_dev(div1, "class", "box row-start-1 row-end-2 col-start-2 col-span-1 absolute");
    			add_location(div1, file$5, 9, 4, 352);
    			attr_dev(div2, "class", "grid overflow-hidden grid-cols-2 grid-rows-1 gap-2 w-full h-full fixed");
    			add_location(div2, file$5, 5, 0, 151);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(telescoutcontrols, div0, null);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			mount_component(telescoutendgame, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(telescoutcontrols.$$.fragment, local);
    			transition_in(telescoutendgame.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(telescoutcontrols.$$.fragment, local);
    			transition_out(telescoutendgame.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(telescoutcontrols);
    			destroy_component(telescoutendgame);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TeleScout', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TeleScout> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ TeleScoutControls, TeleScoutEndgame });
    	return [];
    }

    class TeleScout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TeleScout",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\PostScout.svelte generated by Svelte v3.48.0 */

    const file$4 = "src\\PostScout.svelte";

    // (149:0) {:else}
    function create_else_block$2(ctx) {
    	let button;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z");
    			add_location(path, file$4, 151, 12, 8442);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "h-[90px]");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			add_location(svg, file$4, 150, 8, 8300);
    			attr_dev(button, "class", "btn btn-error btn-square btn-outline w-72 h-24 ml-[350px] mt-[150px] absolute");
    			add_location(button, file$4, 149, 4, 8174);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*shiftBad*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(149:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (144:0) {#if !badStatus}
    function create_if_block$2(ctx) {
    	let button;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z");
    			add_location(path, file$4, 146, 12, 7938);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "h-[50px]");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			add_location(svg, file$4, 145, 8, 7796);
    			attr_dev(button, "class", "btn btn-success btn-square btn-outline w-72 h-24 ml-[350px] mt-[150px] absolute");
    			add_location(button, file$4, 144, 4, 7668);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*shiftBad*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(144:0) {#if !badStatus}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let t0;
    	let br0;
    	let t1;
    	let input0;
    	let t2;
    	let div0;
    	let input1;
    	let t3;
    	let input2;
    	let t4;
    	let input3;
    	let t5;
    	let input4;
    	let t6;
    	let input5;
    	let t7;
    	let input6;
    	let t8;
    	let input7;
    	let t9;
    	let input8;
    	let t10;
    	let input9;
    	let t11;
    	let input10;
    	let t12;
    	let input11;
    	let t13;
    	let div2;
    	let t14;
    	let br1;
    	let t15;
    	let input12;
    	let t16;
    	let div4;
    	let t17;
    	let br2;
    	let t18;
    	let div3;
    	let input13;
    	let t19;
    	let input14;
    	let t20;
    	let input15;
    	let t21;
    	let input16;
    	let t22;
    	let input17;
    	let t23;
    	let input18;
    	let t24;
    	let input19;
    	let t25;
    	let input20;
    	let t26;
    	let input21;
    	let t27;
    	let input22;
    	let t28;
    	let input23;
    	let t29;
    	let div6;
    	let t30;
    	let br3;
    	let t31;
    	let div5;
    	let input24;
    	let t32;
    	let input25;
    	let t33;
    	let input26;
    	let t34;
    	let input27;
    	let t35;
    	let input28;
    	let t36;
    	let input29;
    	let t37;
    	let input30;
    	let t38;
    	let input31;
    	let t39;
    	let input32;
    	let t40;
    	let input33;
    	let t41;
    	let input34;
    	let t42;
    	let t43;
    	let div8;
    	let t44;
    	let br4;
    	let t45;
    	let div7;
    	let input35;
    	let t46;
    	let input36;
    	let t47;
    	let input37;
    	let t48;
    	let input38;
    	let t49;
    	let input39;
    	let t50;
    	let input40;
    	let t51;
    	let input41;
    	let t52;
    	let input42;
    	let t53;
    	let input43;
    	let t54;
    	let input44;
    	let t55;
    	let input45;
    	let t56;
    	let textarea;
    	let t57;
    	let button;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*badStatus*/ ctx[6]) return create_if_block$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			t0 = text("  Played Defense");
    			br0 = element("br");
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div0 = element("div");
    			input1 = element("input");
    			t3 = space();
    			input2 = element("input");
    			t4 = space();
    			input3 = element("input");
    			t5 = space();
    			input4 = element("input");
    			t6 = space();
    			input5 = element("input");
    			t7 = space();
    			input6 = element("input");
    			t8 = space();
    			input7 = element("input");
    			t9 = space();
    			input8 = element("input");
    			t10 = space();
    			input9 = element("input");
    			t11 = space();
    			input10 = element("input");
    			t12 = space();
    			input11 = element("input");
    			t13 = space();
    			div2 = element("div");
    			t14 = text("  Received Defense");
    			br1 = element("br");
    			t15 = space();
    			input12 = element("input");
    			t16 = space();
    			div4 = element("div");
    			t17 = text("  Driving");
    			br2 = element("br");
    			t18 = space();
    			div3 = element("div");
    			input13 = element("input");
    			t19 = space();
    			input14 = element("input");
    			t20 = space();
    			input15 = element("input");
    			t21 = space();
    			input16 = element("input");
    			t22 = space();
    			input17 = element("input");
    			t23 = space();
    			input18 = element("input");
    			t24 = space();
    			input19 = element("input");
    			t25 = space();
    			input20 = element("input");
    			t26 = space();
    			input21 = element("input");
    			t27 = space();
    			input22 = element("input");
    			t28 = space();
    			input23 = element("input");
    			t29 = space();
    			div6 = element("div");
    			t30 = text("  Sauce");
    			br3 = element("br");
    			t31 = space();
    			div5 = element("div");
    			input24 = element("input");
    			t32 = space();
    			input25 = element("input");
    			t33 = space();
    			input26 = element("input");
    			t34 = space();
    			input27 = element("input");
    			t35 = space();
    			input28 = element("input");
    			t36 = space();
    			input29 = element("input");
    			t37 = space();
    			input30 = element("input");
    			t38 = space();
    			input31 = element("input");
    			t39 = space();
    			input32 = element("input");
    			t40 = space();
    			input33 = element("input");
    			t41 = space();
    			input34 = element("input");
    			t42 = space();
    			if_block.c();
    			t43 = space();
    			div8 = element("div");
    			t44 = text("  Intake");
    			br4 = element("br");
    			t45 = space();
    			div7 = element("div");
    			input35 = element("input");
    			t46 = space();
    			input36 = element("input");
    			t47 = space();
    			input37 = element("input");
    			t48 = space();
    			input38 = element("input");
    			t49 = space();
    			input39 = element("input");
    			t50 = space();
    			input40 = element("input");
    			t51 = space();
    			input41 = element("input");
    			t52 = space();
    			input42 = element("input");
    			t53 = space();
    			input43 = element("input");
    			t54 = space();
    			input44 = element("input");
    			t55 = space();
    			input45 = element("input");
    			t56 = space();
    			textarea = element("textarea");
    			t57 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			add_location(br0, file$4, 86, 24, 2276);
    			attr_dev(input0, "type", "range");
    			attr_dev(input0, "min", "0");
    			attr_dev(input0, "max", "100");
    			attr_dev(input0, "class", "range range-secondary w-72 absolute");
    			add_location(input0, file$4, 87, 0, 2282);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "name", "playDefenseRating");
    			attr_dev(input1, "class", "rating-hidden");
    			input1.__value = 0;
    			input1.value = input1.__value;
    			/*$$binding_groups*/ ctx[12][0].push(input1);
    			add_location(input1, file$4, 89, 4, 2475);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "name", "playDefenseRating");
    			attr_dev(input2, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input2.__value = 0.5;
    			input2.value = input2.__value;
    			/*$$binding_groups*/ ctx[12][0].push(input2);
    			add_location(input2, file$4, 90, 4, 2588);
    			attr_dev(input3, "type", "radio");
    			attr_dev(input3, "name", "playDefenseRating");
    			attr_dev(input3, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input3.__value = 1;
    			input3.value = input3.__value;
    			/*$$binding_groups*/ ctx[12][0].push(input3);
    			add_location(input3, file$4, 91, 4, 2730);
    			attr_dev(input4, "type", "radio");
    			attr_dev(input4, "name", "playDefenseRating");
    			attr_dev(input4, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input4.__value = 1.5;
    			input4.value = input4.__value;
    			/*$$binding_groups*/ ctx[12][0].push(input4);
    			add_location(input4, file$4, 92, 4, 2870);
    			attr_dev(input5, "type", "radio");
    			attr_dev(input5, "name", "playDefenseRating");
    			attr_dev(input5, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input5.__value = 2;
    			input5.value = input5.__value;
    			/*$$binding_groups*/ ctx[12][0].push(input5);
    			add_location(input5, file$4, 93, 4, 3012);
    			attr_dev(input6, "type", "radio");
    			attr_dev(input6, "name", "playDefenseRating");
    			attr_dev(input6, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input6.__value = 2.5;
    			input6.value = input6.__value;
    			/*$$binding_groups*/ ctx[12][0].push(input6);
    			add_location(input6, file$4, 94, 4, 3152);
    			attr_dev(input7, "type", "radio");
    			attr_dev(input7, "name", "playDefenseRating");
    			attr_dev(input7, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input7.__value = 3;
    			input7.value = input7.__value;
    			/*$$binding_groups*/ ctx[12][0].push(input7);
    			add_location(input7, file$4, 95, 4, 3294);
    			attr_dev(input8, "type", "radio");
    			attr_dev(input8, "name", "playDefenseRating");
    			attr_dev(input8, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input8.__value = 3.5;
    			input8.value = input8.__value;
    			/*$$binding_groups*/ ctx[12][0].push(input8);
    			add_location(input8, file$4, 96, 4, 3434);
    			attr_dev(input9, "type", "radio");
    			attr_dev(input9, "name", "playDefenseRating");
    			attr_dev(input9, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input9.__value = 4;
    			input9.value = input9.__value;
    			/*$$binding_groups*/ ctx[12][0].push(input9);
    			add_location(input9, file$4, 97, 4, 3576);
    			attr_dev(input10, "type", "radio");
    			attr_dev(input10, "name", "playDefenseRating");
    			attr_dev(input10, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input10.__value = 4.5;
    			input10.value = input10.__value;
    			/*$$binding_groups*/ ctx[12][0].push(input10);
    			add_location(input10, file$4, 98, 4, 3716);
    			attr_dev(input11, "type", "radio");
    			attr_dev(input11, "name", "playDefenseRating");
    			attr_dev(input11, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input11.__value = 5;
    			input11.value = input11.__value;
    			/*$$binding_groups*/ ctx[12][0].push(input11);
    			add_location(input11, file$4, 99, 4, 3858);
    			attr_dev(div0, "class", "rating rating-lg rating-half absolute absolute mt-9 ml-10");
    			add_location(div0, file$4, 88, 0, 2398);
    			attr_dev(div1, "class", "ml-[10px] absolute font-bold text-xl leading-[40px]");
    			add_location(div1, file$4, 85, 0, 2185);
    			add_location(br1, file$4, 104, 26, 4106);
    			attr_dev(input12, "type", "range");
    			attr_dev(input12, "min", "0");
    			attr_dev(input12, "max", "100");
    			attr_dev(input12, "class", "range range-secondary w-72 absolute");
    			add_location(input12, file$4, 105, 4, 4116);
    			attr_dev(div2, "class", "ml-[350px] absolute font-bold text-xl leading-[40px]");
    			add_location(div2, file$4, 103, 0, 4012);
    			add_location(br2, file$4, 109, 17, 4339);
    			attr_dev(input13, "type", "radio");
    			attr_dev(input13, "name", "drivingRating");
    			attr_dev(input13, "class", "rating-hidden");
    			input13.__value = 0;
    			input13.value = input13.__value;
    			/*$$binding_groups*/ ctx[12][1].push(input13);
    			add_location(input13, file$4, 111, 8, 4430);
    			attr_dev(input14, "type", "radio");
    			attr_dev(input14, "name", "drivingRating");
    			attr_dev(input14, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input14.__value = 0.5;
    			input14.value = input14.__value;
    			/*$$binding_groups*/ ctx[12][1].push(input14);
    			add_location(input14, file$4, 112, 8, 4543);
    			attr_dev(input15, "type", "radio");
    			attr_dev(input15, "name", "drivingRating");
    			attr_dev(input15, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input15.__value = 1;
    			input15.value = input15.__value;
    			/*$$binding_groups*/ ctx[12][1].push(input15);
    			add_location(input15, file$4, 113, 8, 4685);
    			attr_dev(input16, "type", "radio");
    			attr_dev(input16, "name", "drivingRating");
    			attr_dev(input16, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input16.__value = 1.5;
    			input16.value = input16.__value;
    			/*$$binding_groups*/ ctx[12][1].push(input16);
    			add_location(input16, file$4, 114, 8, 4825);
    			attr_dev(input17, "type", "radio");
    			attr_dev(input17, "name", "drivingRating");
    			attr_dev(input17, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input17.__value = 2;
    			input17.value = input17.__value;
    			/*$$binding_groups*/ ctx[12][1].push(input17);
    			add_location(input17, file$4, 115, 8, 4967);
    			attr_dev(input18, "type", "radio");
    			attr_dev(input18, "name", "drivingRating");
    			attr_dev(input18, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input18.__value = 2.5;
    			input18.value = input18.__value;
    			/*$$binding_groups*/ ctx[12][1].push(input18);
    			add_location(input18, file$4, 116, 8, 5107);
    			attr_dev(input19, "type", "radio");
    			attr_dev(input19, "name", "drivingRating");
    			attr_dev(input19, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input19.__value = 3;
    			input19.value = input19.__value;
    			/*$$binding_groups*/ ctx[12][1].push(input19);
    			add_location(input19, file$4, 117, 8, 5249);
    			attr_dev(input20, "type", "radio");
    			attr_dev(input20, "name", "drivingRating");
    			attr_dev(input20, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input20.__value = 3.5;
    			input20.value = input20.__value;
    			/*$$binding_groups*/ ctx[12][1].push(input20);
    			add_location(input20, file$4, 118, 8, 5389);
    			attr_dev(input21, "type", "radio");
    			attr_dev(input21, "name", "drivingRating");
    			attr_dev(input21, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input21.__value = 4;
    			input21.value = input21.__value;
    			/*$$binding_groups*/ ctx[12][1].push(input21);
    			add_location(input21, file$4, 119, 8, 5531);
    			attr_dev(input22, "type", "radio");
    			attr_dev(input22, "name", "drivingRating");
    			attr_dev(input22, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input22.__value = 4.5;
    			input22.value = input22.__value;
    			/*$$binding_groups*/ ctx[12][1].push(input22);
    			add_location(input22, file$4, 120, 8, 5671);
    			attr_dev(input23, "type", "radio");
    			attr_dev(input23, "name", "drivingRating");
    			attr_dev(input23, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input23.__value = 5;
    			input23.value = input23.__value;
    			/*$$binding_groups*/ ctx[12][1].push(input23);
    			add_location(input23, file$4, 121, 8, 5813);
    			attr_dev(div3, "class", "rating rating-lg rating-half absolute absolute -mt-1 ml-1");
    			add_location(div3, file$4, 110, 4, 4349);
    			attr_dev(div4, "class", "ml-[700px] absolute font-bold text-xl leading-[40px] absolute");
    			add_location(div4, file$4, 108, 0, 4245);
    			add_location(br3, file$4, 126, 15, 6060);
    			attr_dev(input24, "type", "radio");
    			attr_dev(input24, "name", "sauceRating");
    			attr_dev(input24, "class", "rating-hidden");
    			input24.__value = 0;
    			input24.value = input24.__value;
    			/*$$binding_groups*/ ctx[12][2].push(input24);
    			add_location(input24, file$4, 128, 8, 6151);
    			attr_dev(input25, "type", "radio");
    			attr_dev(input25, "name", "sauceRating");
    			attr_dev(input25, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input25.__value = 0.5;
    			input25.value = input25.__value;
    			/*$$binding_groups*/ ctx[12][2].push(input25);
    			add_location(input25, file$4, 129, 8, 6260);
    			attr_dev(input26, "type", "radio");
    			attr_dev(input26, "name", "sauceRating");
    			attr_dev(input26, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input26.__value = 1;
    			input26.value = input26.__value;
    			/*$$binding_groups*/ ctx[12][2].push(input26);
    			add_location(input26, file$4, 130, 8, 6398);
    			attr_dev(input27, "type", "radio");
    			attr_dev(input27, "name", "sauceRating");
    			attr_dev(input27, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input27.__value = 1.5;
    			input27.value = input27.__value;
    			/*$$binding_groups*/ ctx[12][2].push(input27);
    			add_location(input27, file$4, 131, 8, 6534);
    			attr_dev(input28, "type", "radio");
    			attr_dev(input28, "name", "sauceRating");
    			attr_dev(input28, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input28.__value = 2;
    			input28.value = input28.__value;
    			/*$$binding_groups*/ ctx[12][2].push(input28);
    			add_location(input28, file$4, 132, 8, 6672);
    			attr_dev(input29, "type", "radio");
    			attr_dev(input29, "name", "sauceRating");
    			attr_dev(input29, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input29.__value = 2.5;
    			input29.value = input29.__value;
    			/*$$binding_groups*/ ctx[12][2].push(input29);
    			add_location(input29, file$4, 133, 8, 6808);
    			attr_dev(input30, "type", "radio");
    			attr_dev(input30, "name", "sauceRating");
    			attr_dev(input30, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input30.__value = 3;
    			input30.value = input30.__value;
    			/*$$binding_groups*/ ctx[12][2].push(input30);
    			add_location(input30, file$4, 134, 8, 6946);
    			attr_dev(input31, "type", "radio");
    			attr_dev(input31, "name", "sauceRating");
    			attr_dev(input31, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input31.__value = 3.5;
    			input31.value = input31.__value;
    			/*$$binding_groups*/ ctx[12][2].push(input31);
    			add_location(input31, file$4, 135, 8, 7082);
    			attr_dev(input32, "type", "radio");
    			attr_dev(input32, "name", "sauceRating");
    			attr_dev(input32, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input32.__value = 4;
    			input32.value = input32.__value;
    			/*$$binding_groups*/ ctx[12][2].push(input32);
    			add_location(input32, file$4, 136, 8, 7220);
    			attr_dev(input33, "type", "radio");
    			attr_dev(input33, "name", "sauceRating");
    			attr_dev(input33, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input33.__value = 4.5;
    			input33.value = input33.__value;
    			/*$$binding_groups*/ ctx[12][2].push(input33);
    			add_location(input33, file$4, 137, 8, 7356);
    			attr_dev(input34, "type", "radio");
    			attr_dev(input34, "name", "sauceRating");
    			attr_dev(input34, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input34.__value = 5;
    			input34.value = input34.__value;
    			/*$$binding_groups*/ ctx[12][2].push(input34);
    			add_location(input34, file$4, 138, 8, 7494);
    			attr_dev(div5, "class", "rating rating-lg rating-half absolute absolute -mt-1 ml-1");
    			add_location(div5, file$4, 127, 4, 6070);
    			attr_dev(div6, "class", "ml-[10px] mt-[160px] absolute font-bold text-xl leading-[40px]");
    			add_location(div6, file$4, 125, 0, 5967);
    			add_location(br4, file$4, 156, 16, 8769);
    			attr_dev(input35, "type", "radio");
    			attr_dev(input35, "name", "intakeRating");
    			attr_dev(input35, "class", "rating-hidden");
    			input35.__value = 0;
    			input35.value = input35.__value;
    			/*$$binding_groups*/ ctx[12][3].push(input35);
    			add_location(input35, file$4, 158, 8, 8860);
    			attr_dev(input36, "type", "radio");
    			attr_dev(input36, "name", "intakeRating");
    			attr_dev(input36, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input36.__value = 0.5;
    			input36.value = input36.__value;
    			/*$$binding_groups*/ ctx[12][3].push(input36);
    			add_location(input36, file$4, 159, 8, 8971);
    			attr_dev(input37, "type", "radio");
    			attr_dev(input37, "name", "intakeRating");
    			attr_dev(input37, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input37.__value = 1;
    			input37.value = input37.__value;
    			/*$$binding_groups*/ ctx[12][3].push(input37);
    			add_location(input37, file$4, 160, 8, 9111);
    			attr_dev(input38, "type", "radio");
    			attr_dev(input38, "name", "intakeRating");
    			attr_dev(input38, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input38.__value = 1.5;
    			input38.value = input38.__value;
    			/*$$binding_groups*/ ctx[12][3].push(input38);
    			add_location(input38, file$4, 161, 8, 9249);
    			attr_dev(input39, "type", "radio");
    			attr_dev(input39, "name", "intakeRating");
    			attr_dev(input39, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input39.__value = 2;
    			input39.value = input39.__value;
    			/*$$binding_groups*/ ctx[12][3].push(input39);
    			add_location(input39, file$4, 162, 8, 9389);
    			attr_dev(input40, "type", "radio");
    			attr_dev(input40, "name", "intakeRating");
    			attr_dev(input40, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input40.__value = 2.5;
    			input40.value = input40.__value;
    			/*$$binding_groups*/ ctx[12][3].push(input40);
    			add_location(input40, file$4, 163, 8, 9527);
    			attr_dev(input41, "type", "radio");
    			attr_dev(input41, "name", "intakeRating");
    			attr_dev(input41, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input41.__value = 3;
    			input41.value = input41.__value;
    			/*$$binding_groups*/ ctx[12][3].push(input41);
    			add_location(input41, file$4, 164, 8, 9667);
    			attr_dev(input42, "type", "radio");
    			attr_dev(input42, "name", "intakeRating");
    			attr_dev(input42, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input42.__value = 3.5;
    			input42.value = input42.__value;
    			/*$$binding_groups*/ ctx[12][3].push(input42);
    			add_location(input42, file$4, 165, 8, 9805);
    			attr_dev(input43, "type", "radio");
    			attr_dev(input43, "name", "intakeRating");
    			attr_dev(input43, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input43.__value = 4;
    			input43.value = input43.__value;
    			/*$$binding_groups*/ ctx[12][3].push(input43);
    			add_location(input43, file$4, 166, 8, 9945);
    			attr_dev(input44, "type", "radio");
    			attr_dev(input44, "name", "intakeRating");
    			attr_dev(input44, "class", "bg-amber-500 mask mask-star-2 mask-half-1");
    			input44.__value = 4.5;
    			input44.value = input44.__value;
    			/*$$binding_groups*/ ctx[12][3].push(input44);
    			add_location(input44, file$4, 167, 8, 10083);
    			attr_dev(input45, "type", "radio");
    			attr_dev(input45, "name", "intakeRating");
    			attr_dev(input45, "class", "bg-amber-500 mask mask-star-2 mask-half-2");
    			input45.__value = 5;
    			input45.value = input45.__value;
    			/*$$binding_groups*/ ctx[12][3].push(input45);
    			add_location(input45, file$4, 168, 8, 10223);
    			attr_dev(div7, "class", "rating rating-lg rating-half absolute absolute -mt-1 ml-1");
    			add_location(div7, file$4, 157, 4, 8779);
    			attr_dev(div8, "class", "ml-[700px] font-bold text-xl leading-[40px] absolute mt-[160px]");
    			add_location(div8, file$4, 155, 0, 8674);
    			attr_dev(textarea, "class", "textarea text-3xl textarea-primary fixed ml-5 w-[665px] h-[200px] mt-72");
    			attr_dev(textarea, "placeholder", "Comment");
    			add_location(textarea, file$4, 171, 0, 10373);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "d", "M5 13l4 4L19 7");
    			add_location(path, file$4, 174, 8, 10786);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "h-24 w-24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			add_location(svg, file$4, 173, 4, 10647);
    			attr_dev(button, "class", "btn btn-square btn-success btn-outline z-40 w-[200px] h-[200px] ml-[750px] mt-72");
    			add_location(button, file$4, 172, 0, 10525);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t0);
    			append_dev(div1, br0);
    			append_dev(div1, t1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*defenseDuration*/ ctx[2]);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, input1);
    			input1.checked = input1.__value === /*defenseRating*/ ctx[0];
    			append_dev(div0, t3);
    			append_dev(div0, input2);
    			input2.checked = input2.__value === /*defenseRating*/ ctx[0];
    			append_dev(div0, t4);
    			append_dev(div0, input3);
    			input3.checked = input3.__value === /*defenseRating*/ ctx[0];
    			append_dev(div0, t5);
    			append_dev(div0, input4);
    			input4.checked = input4.__value === /*defenseRating*/ ctx[0];
    			append_dev(div0, t6);
    			append_dev(div0, input5);
    			input5.checked = input5.__value === /*defenseRating*/ ctx[0];
    			append_dev(div0, t7);
    			append_dev(div0, input6);
    			input6.checked = input6.__value === /*defenseRating*/ ctx[0];
    			append_dev(div0, t8);
    			append_dev(div0, input7);
    			input7.checked = input7.__value === /*defenseRating*/ ctx[0];
    			append_dev(div0, t9);
    			append_dev(div0, input8);
    			input8.checked = input8.__value === /*defenseRating*/ ctx[0];
    			append_dev(div0, t10);
    			append_dev(div0, input9);
    			input9.checked = input9.__value === /*defenseRating*/ ctx[0];
    			append_dev(div0, t11);
    			append_dev(div0, input10);
    			input10.checked = input10.__value === /*defenseRating*/ ctx[0];
    			append_dev(div0, t12);
    			append_dev(div0, input11);
    			input11.checked = input11.__value === /*defenseRating*/ ctx[0];
    			insert_dev(target, t13, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, t14);
    			append_dev(div2, br1);
    			append_dev(div2, t15);
    			append_dev(div2, input12);
    			set_input_value(input12, /*recDefenseDuration*/ ctx[3]);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, t17);
    			append_dev(div4, br2);
    			append_dev(div4, t18);
    			append_dev(div4, div3);
    			append_dev(div3, input13);
    			input13.checked = input13.__value === /*drivingRating*/ ctx[1];
    			append_dev(div3, t19);
    			append_dev(div3, input14);
    			input14.checked = input14.__value === /*drivingRating*/ ctx[1];
    			append_dev(div3, t20);
    			append_dev(div3, input15);
    			input15.checked = input15.__value === /*drivingRating*/ ctx[1];
    			append_dev(div3, t21);
    			append_dev(div3, input16);
    			input16.checked = input16.__value === /*drivingRating*/ ctx[1];
    			append_dev(div3, t22);
    			append_dev(div3, input17);
    			input17.checked = input17.__value === /*drivingRating*/ ctx[1];
    			append_dev(div3, t23);
    			append_dev(div3, input18);
    			input18.checked = input18.__value === /*drivingRating*/ ctx[1];
    			append_dev(div3, t24);
    			append_dev(div3, input19);
    			input19.checked = input19.__value === /*drivingRating*/ ctx[1];
    			append_dev(div3, t25);
    			append_dev(div3, input20);
    			input20.checked = input20.__value === /*drivingRating*/ ctx[1];
    			append_dev(div3, t26);
    			append_dev(div3, input21);
    			input21.checked = input21.__value === /*drivingRating*/ ctx[1];
    			append_dev(div3, t27);
    			append_dev(div3, input22);
    			input22.checked = input22.__value === /*drivingRating*/ ctx[1];
    			append_dev(div3, t28);
    			append_dev(div3, input23);
    			input23.checked = input23.__value === /*drivingRating*/ ctx[1];
    			insert_dev(target, t29, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, t30);
    			append_dev(div6, br3);
    			append_dev(div6, t31);
    			append_dev(div6, div5);
    			append_dev(div5, input24);
    			input24.checked = input24.__value === /*sauceRating*/ ctx[4];
    			append_dev(div5, t32);
    			append_dev(div5, input25);
    			input25.checked = input25.__value === /*sauceRating*/ ctx[4];
    			append_dev(div5, t33);
    			append_dev(div5, input26);
    			input26.checked = input26.__value === /*sauceRating*/ ctx[4];
    			append_dev(div5, t34);
    			append_dev(div5, input27);
    			input27.checked = input27.__value === /*sauceRating*/ ctx[4];
    			append_dev(div5, t35);
    			append_dev(div5, input28);
    			input28.checked = input28.__value === /*sauceRating*/ ctx[4];
    			append_dev(div5, t36);
    			append_dev(div5, input29);
    			input29.checked = input29.__value === /*sauceRating*/ ctx[4];
    			append_dev(div5, t37);
    			append_dev(div5, input30);
    			input30.checked = input30.__value === /*sauceRating*/ ctx[4];
    			append_dev(div5, t38);
    			append_dev(div5, input31);
    			input31.checked = input31.__value === /*sauceRating*/ ctx[4];
    			append_dev(div5, t39);
    			append_dev(div5, input32);
    			input32.checked = input32.__value === /*sauceRating*/ ctx[4];
    			append_dev(div5, t40);
    			append_dev(div5, input33);
    			input33.checked = input33.__value === /*sauceRating*/ ctx[4];
    			append_dev(div5, t41);
    			append_dev(div5, input34);
    			input34.checked = input34.__value === /*sauceRating*/ ctx[4];
    			insert_dev(target, t42, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, t43, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, t44);
    			append_dev(div8, br4);
    			append_dev(div8, t45);
    			append_dev(div8, div7);
    			append_dev(div7, input35);
    			input35.checked = input35.__value === /*intakeRating*/ ctx[5];
    			append_dev(div7, t46);
    			append_dev(div7, input36);
    			input36.checked = input36.__value === /*intakeRating*/ ctx[5];
    			append_dev(div7, t47);
    			append_dev(div7, input37);
    			input37.checked = input37.__value === /*intakeRating*/ ctx[5];
    			append_dev(div7, t48);
    			append_dev(div7, input38);
    			input38.checked = input38.__value === /*intakeRating*/ ctx[5];
    			append_dev(div7, t49);
    			append_dev(div7, input39);
    			input39.checked = input39.__value === /*intakeRating*/ ctx[5];
    			append_dev(div7, t50);
    			append_dev(div7, input40);
    			input40.checked = input40.__value === /*intakeRating*/ ctx[5];
    			append_dev(div7, t51);
    			append_dev(div7, input41);
    			input41.checked = input41.__value === /*intakeRating*/ ctx[5];
    			append_dev(div7, t52);
    			append_dev(div7, input42);
    			input42.checked = input42.__value === /*intakeRating*/ ctx[5];
    			append_dev(div7, t53);
    			append_dev(div7, input43);
    			input43.checked = input43.__value === /*intakeRating*/ ctx[5];
    			append_dev(div7, t54);
    			append_dev(div7, input44);
    			input44.checked = input44.__value === /*intakeRating*/ ctx[5];
    			append_dev(div7, t55);
    			append_dev(div7, input45);
    			input45.checked = input45.__value === /*intakeRating*/ ctx[5];
    			insert_dev(target, t56, anchor);
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*commentText*/ ctx[7]);
    			insert_dev(target, t57, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_input_handler*/ ctx[10]),
    					listen_dev(input0, "input", /*input0_change_input_handler*/ ctx[10]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[11]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[13]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[14]),
    					listen_dev(input4, "change", /*input4_change_handler*/ ctx[15]),
    					listen_dev(input5, "change", /*input5_change_handler*/ ctx[16]),
    					listen_dev(input6, "change", /*input6_change_handler*/ ctx[17]),
    					listen_dev(input7, "change", /*input7_change_handler*/ ctx[18]),
    					listen_dev(input8, "change", /*input8_change_handler*/ ctx[19]),
    					listen_dev(input9, "change", /*input9_change_handler*/ ctx[20]),
    					listen_dev(input10, "change", /*input10_change_handler*/ ctx[21]),
    					listen_dev(input11, "change", /*input11_change_handler*/ ctx[22]),
    					listen_dev(input12, "change", /*input12_change_input_handler*/ ctx[23]),
    					listen_dev(input12, "input", /*input12_change_input_handler*/ ctx[23]),
    					listen_dev(input13, "change", /*input13_change_handler*/ ctx[24]),
    					listen_dev(input14, "change", /*input14_change_handler*/ ctx[25]),
    					listen_dev(input15, "change", /*input15_change_handler*/ ctx[26]),
    					listen_dev(input16, "change", /*input16_change_handler*/ ctx[27]),
    					listen_dev(input17, "change", /*input17_change_handler*/ ctx[28]),
    					listen_dev(input18, "change", /*input18_change_handler*/ ctx[29]),
    					listen_dev(input19, "change", /*input19_change_handler*/ ctx[30]),
    					listen_dev(input20, "change", /*input20_change_handler*/ ctx[31]),
    					listen_dev(input21, "change", /*input21_change_handler*/ ctx[32]),
    					listen_dev(input22, "change", /*input22_change_handler*/ ctx[33]),
    					listen_dev(input23, "change", /*input23_change_handler*/ ctx[34]),
    					listen_dev(input24, "change", /*input24_change_handler*/ ctx[35]),
    					listen_dev(input25, "change", /*input25_change_handler*/ ctx[36]),
    					listen_dev(input26, "change", /*input26_change_handler*/ ctx[37]),
    					listen_dev(input27, "change", /*input27_change_handler*/ ctx[38]),
    					listen_dev(input28, "change", /*input28_change_handler*/ ctx[39]),
    					listen_dev(input29, "change", /*input29_change_handler*/ ctx[40]),
    					listen_dev(input30, "change", /*input30_change_handler*/ ctx[41]),
    					listen_dev(input31, "change", /*input31_change_handler*/ ctx[42]),
    					listen_dev(input32, "change", /*input32_change_handler*/ ctx[43]),
    					listen_dev(input33, "change", /*input33_change_handler*/ ctx[44]),
    					listen_dev(input34, "change", /*input34_change_handler*/ ctx[45]),
    					listen_dev(input35, "change", /*input35_change_handler*/ ctx[46]),
    					listen_dev(input36, "change", /*input36_change_handler*/ ctx[47]),
    					listen_dev(input37, "change", /*input37_change_handler*/ ctx[48]),
    					listen_dev(input38, "change", /*input38_change_handler*/ ctx[49]),
    					listen_dev(input39, "change", /*input39_change_handler*/ ctx[50]),
    					listen_dev(input40, "change", /*input40_change_handler*/ ctx[51]),
    					listen_dev(input41, "change", /*input41_change_handler*/ ctx[52]),
    					listen_dev(input42, "change", /*input42_change_handler*/ ctx[53]),
    					listen_dev(input43, "change", /*input43_change_handler*/ ctx[54]),
    					listen_dev(input44, "change", /*input44_change_handler*/ ctx[55]),
    					listen_dev(input45, "change", /*input45_change_handler*/ ctx[56]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[57]),
    					listen_dev(button, "click", /*QRTime*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*defenseDuration*/ 4) {
    				set_input_value(input0, /*defenseDuration*/ ctx[2]);
    			}

    			if (dirty[0] & /*defenseRating*/ 1) {
    				input1.checked = input1.__value === /*defenseRating*/ ctx[0];
    			}

    			if (dirty[0] & /*defenseRating*/ 1) {
    				input2.checked = input2.__value === /*defenseRating*/ ctx[0];
    			}

    			if (dirty[0] & /*defenseRating*/ 1) {
    				input3.checked = input3.__value === /*defenseRating*/ ctx[0];
    			}

    			if (dirty[0] & /*defenseRating*/ 1) {
    				input4.checked = input4.__value === /*defenseRating*/ ctx[0];
    			}

    			if (dirty[0] & /*defenseRating*/ 1) {
    				input5.checked = input5.__value === /*defenseRating*/ ctx[0];
    			}

    			if (dirty[0] & /*defenseRating*/ 1) {
    				input6.checked = input6.__value === /*defenseRating*/ ctx[0];
    			}

    			if (dirty[0] & /*defenseRating*/ 1) {
    				input7.checked = input7.__value === /*defenseRating*/ ctx[0];
    			}

    			if (dirty[0] & /*defenseRating*/ 1) {
    				input8.checked = input8.__value === /*defenseRating*/ ctx[0];
    			}

    			if (dirty[0] & /*defenseRating*/ 1) {
    				input9.checked = input9.__value === /*defenseRating*/ ctx[0];
    			}

    			if (dirty[0] & /*defenseRating*/ 1) {
    				input10.checked = input10.__value === /*defenseRating*/ ctx[0];
    			}

    			if (dirty[0] & /*defenseRating*/ 1) {
    				input11.checked = input11.__value === /*defenseRating*/ ctx[0];
    			}

    			if (dirty[0] & /*recDefenseDuration*/ 8) {
    				set_input_value(input12, /*recDefenseDuration*/ ctx[3]);
    			}

    			if (dirty[0] & /*drivingRating*/ 2) {
    				input13.checked = input13.__value === /*drivingRating*/ ctx[1];
    			}

    			if (dirty[0] & /*drivingRating*/ 2) {
    				input14.checked = input14.__value === /*drivingRating*/ ctx[1];
    			}

    			if (dirty[0] & /*drivingRating*/ 2) {
    				input15.checked = input15.__value === /*drivingRating*/ ctx[1];
    			}

    			if (dirty[0] & /*drivingRating*/ 2) {
    				input16.checked = input16.__value === /*drivingRating*/ ctx[1];
    			}

    			if (dirty[0] & /*drivingRating*/ 2) {
    				input17.checked = input17.__value === /*drivingRating*/ ctx[1];
    			}

    			if (dirty[0] & /*drivingRating*/ 2) {
    				input18.checked = input18.__value === /*drivingRating*/ ctx[1];
    			}

    			if (dirty[0] & /*drivingRating*/ 2) {
    				input19.checked = input19.__value === /*drivingRating*/ ctx[1];
    			}

    			if (dirty[0] & /*drivingRating*/ 2) {
    				input20.checked = input20.__value === /*drivingRating*/ ctx[1];
    			}

    			if (dirty[0] & /*drivingRating*/ 2) {
    				input21.checked = input21.__value === /*drivingRating*/ ctx[1];
    			}

    			if (dirty[0] & /*drivingRating*/ 2) {
    				input22.checked = input22.__value === /*drivingRating*/ ctx[1];
    			}

    			if (dirty[0] & /*drivingRating*/ 2) {
    				input23.checked = input23.__value === /*drivingRating*/ ctx[1];
    			}

    			if (dirty[0] & /*sauceRating*/ 16) {
    				input24.checked = input24.__value === /*sauceRating*/ ctx[4];
    			}

    			if (dirty[0] & /*sauceRating*/ 16) {
    				input25.checked = input25.__value === /*sauceRating*/ ctx[4];
    			}

    			if (dirty[0] & /*sauceRating*/ 16) {
    				input26.checked = input26.__value === /*sauceRating*/ ctx[4];
    			}

    			if (dirty[0] & /*sauceRating*/ 16) {
    				input27.checked = input27.__value === /*sauceRating*/ ctx[4];
    			}

    			if (dirty[0] & /*sauceRating*/ 16) {
    				input28.checked = input28.__value === /*sauceRating*/ ctx[4];
    			}

    			if (dirty[0] & /*sauceRating*/ 16) {
    				input29.checked = input29.__value === /*sauceRating*/ ctx[4];
    			}

    			if (dirty[0] & /*sauceRating*/ 16) {
    				input30.checked = input30.__value === /*sauceRating*/ ctx[4];
    			}

    			if (dirty[0] & /*sauceRating*/ 16) {
    				input31.checked = input31.__value === /*sauceRating*/ ctx[4];
    			}

    			if (dirty[0] & /*sauceRating*/ 16) {
    				input32.checked = input32.__value === /*sauceRating*/ ctx[4];
    			}

    			if (dirty[0] & /*sauceRating*/ 16) {
    				input33.checked = input33.__value === /*sauceRating*/ ctx[4];
    			}

    			if (dirty[0] & /*sauceRating*/ 16) {
    				input34.checked = input34.__value === /*sauceRating*/ ctx[4];
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t43.parentNode, t43);
    				}
    			}

    			if (dirty[0] & /*intakeRating*/ 32) {
    				input35.checked = input35.__value === /*intakeRating*/ ctx[5];
    			}

    			if (dirty[0] & /*intakeRating*/ 32) {
    				input36.checked = input36.__value === /*intakeRating*/ ctx[5];
    			}

    			if (dirty[0] & /*intakeRating*/ 32) {
    				input37.checked = input37.__value === /*intakeRating*/ ctx[5];
    			}

    			if (dirty[0] & /*intakeRating*/ 32) {
    				input38.checked = input38.__value === /*intakeRating*/ ctx[5];
    			}

    			if (dirty[0] & /*intakeRating*/ 32) {
    				input39.checked = input39.__value === /*intakeRating*/ ctx[5];
    			}

    			if (dirty[0] & /*intakeRating*/ 32) {
    				input40.checked = input40.__value === /*intakeRating*/ ctx[5];
    			}

    			if (dirty[0] & /*intakeRating*/ 32) {
    				input41.checked = input41.__value === /*intakeRating*/ ctx[5];
    			}

    			if (dirty[0] & /*intakeRating*/ 32) {
    				input42.checked = input42.__value === /*intakeRating*/ ctx[5];
    			}

    			if (dirty[0] & /*intakeRating*/ 32) {
    				input43.checked = input43.__value === /*intakeRating*/ ctx[5];
    			}

    			if (dirty[0] & /*intakeRating*/ 32) {
    				input44.checked = input44.__value === /*intakeRating*/ ctx[5];
    			}

    			if (dirty[0] & /*intakeRating*/ 32) {
    				input45.checked = input45.__value === /*intakeRating*/ ctx[5];
    			}

    			if (dirty[0] & /*commentText*/ 128) {
    				set_input_value(textarea, /*commentText*/ ctx[7]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*$$binding_groups*/ ctx[12][0].splice(/*$$binding_groups*/ ctx[12][0].indexOf(input1), 1);
    			/*$$binding_groups*/ ctx[12][0].splice(/*$$binding_groups*/ ctx[12][0].indexOf(input2), 1);
    			/*$$binding_groups*/ ctx[12][0].splice(/*$$binding_groups*/ ctx[12][0].indexOf(input3), 1);
    			/*$$binding_groups*/ ctx[12][0].splice(/*$$binding_groups*/ ctx[12][0].indexOf(input4), 1);
    			/*$$binding_groups*/ ctx[12][0].splice(/*$$binding_groups*/ ctx[12][0].indexOf(input5), 1);
    			/*$$binding_groups*/ ctx[12][0].splice(/*$$binding_groups*/ ctx[12][0].indexOf(input6), 1);
    			/*$$binding_groups*/ ctx[12][0].splice(/*$$binding_groups*/ ctx[12][0].indexOf(input7), 1);
    			/*$$binding_groups*/ ctx[12][0].splice(/*$$binding_groups*/ ctx[12][0].indexOf(input8), 1);
    			/*$$binding_groups*/ ctx[12][0].splice(/*$$binding_groups*/ ctx[12][0].indexOf(input9), 1);
    			/*$$binding_groups*/ ctx[12][0].splice(/*$$binding_groups*/ ctx[12][0].indexOf(input10), 1);
    			/*$$binding_groups*/ ctx[12][0].splice(/*$$binding_groups*/ ctx[12][0].indexOf(input11), 1);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(div4);
    			/*$$binding_groups*/ ctx[12][1].splice(/*$$binding_groups*/ ctx[12][1].indexOf(input13), 1);
    			/*$$binding_groups*/ ctx[12][1].splice(/*$$binding_groups*/ ctx[12][1].indexOf(input14), 1);
    			/*$$binding_groups*/ ctx[12][1].splice(/*$$binding_groups*/ ctx[12][1].indexOf(input15), 1);
    			/*$$binding_groups*/ ctx[12][1].splice(/*$$binding_groups*/ ctx[12][1].indexOf(input16), 1);
    			/*$$binding_groups*/ ctx[12][1].splice(/*$$binding_groups*/ ctx[12][1].indexOf(input17), 1);
    			/*$$binding_groups*/ ctx[12][1].splice(/*$$binding_groups*/ ctx[12][1].indexOf(input18), 1);
    			/*$$binding_groups*/ ctx[12][1].splice(/*$$binding_groups*/ ctx[12][1].indexOf(input19), 1);
    			/*$$binding_groups*/ ctx[12][1].splice(/*$$binding_groups*/ ctx[12][1].indexOf(input20), 1);
    			/*$$binding_groups*/ ctx[12][1].splice(/*$$binding_groups*/ ctx[12][1].indexOf(input21), 1);
    			/*$$binding_groups*/ ctx[12][1].splice(/*$$binding_groups*/ ctx[12][1].indexOf(input22), 1);
    			/*$$binding_groups*/ ctx[12][1].splice(/*$$binding_groups*/ ctx[12][1].indexOf(input23), 1);
    			if (detaching) detach_dev(t29);
    			if (detaching) detach_dev(div6);
    			/*$$binding_groups*/ ctx[12][2].splice(/*$$binding_groups*/ ctx[12][2].indexOf(input24), 1);
    			/*$$binding_groups*/ ctx[12][2].splice(/*$$binding_groups*/ ctx[12][2].indexOf(input25), 1);
    			/*$$binding_groups*/ ctx[12][2].splice(/*$$binding_groups*/ ctx[12][2].indexOf(input26), 1);
    			/*$$binding_groups*/ ctx[12][2].splice(/*$$binding_groups*/ ctx[12][2].indexOf(input27), 1);
    			/*$$binding_groups*/ ctx[12][2].splice(/*$$binding_groups*/ ctx[12][2].indexOf(input28), 1);
    			/*$$binding_groups*/ ctx[12][2].splice(/*$$binding_groups*/ ctx[12][2].indexOf(input29), 1);
    			/*$$binding_groups*/ ctx[12][2].splice(/*$$binding_groups*/ ctx[12][2].indexOf(input30), 1);
    			/*$$binding_groups*/ ctx[12][2].splice(/*$$binding_groups*/ ctx[12][2].indexOf(input31), 1);
    			/*$$binding_groups*/ ctx[12][2].splice(/*$$binding_groups*/ ctx[12][2].indexOf(input32), 1);
    			/*$$binding_groups*/ ctx[12][2].splice(/*$$binding_groups*/ ctx[12][2].indexOf(input33), 1);
    			/*$$binding_groups*/ ctx[12][2].splice(/*$$binding_groups*/ ctx[12][2].indexOf(input34), 1);
    			if (detaching) detach_dev(t42);
    			if_block.d(detaching);
    			if (detaching) detach_dev(t43);
    			if (detaching) detach_dev(div8);
    			/*$$binding_groups*/ ctx[12][3].splice(/*$$binding_groups*/ ctx[12][3].indexOf(input35), 1);
    			/*$$binding_groups*/ ctx[12][3].splice(/*$$binding_groups*/ ctx[12][3].indexOf(input36), 1);
    			/*$$binding_groups*/ ctx[12][3].splice(/*$$binding_groups*/ ctx[12][3].indexOf(input37), 1);
    			/*$$binding_groups*/ ctx[12][3].splice(/*$$binding_groups*/ ctx[12][3].indexOf(input38), 1);
    			/*$$binding_groups*/ ctx[12][3].splice(/*$$binding_groups*/ ctx[12][3].indexOf(input39), 1);
    			/*$$binding_groups*/ ctx[12][3].splice(/*$$binding_groups*/ ctx[12][3].indexOf(input40), 1);
    			/*$$binding_groups*/ ctx[12][3].splice(/*$$binding_groups*/ ctx[12][3].indexOf(input41), 1);
    			/*$$binding_groups*/ ctx[12][3].splice(/*$$binding_groups*/ ctx[12][3].indexOf(input42), 1);
    			/*$$binding_groups*/ ctx[12][3].splice(/*$$binding_groups*/ ctx[12][3].indexOf(input43), 1);
    			/*$$binding_groups*/ ctx[12][3].splice(/*$$binding_groups*/ ctx[12][3].indexOf(input44), 1);
    			/*$$binding_groups*/ ctx[12][3].splice(/*$$binding_groups*/ ctx[12][3].indexOf(input45), 1);
    			if (detaching) detach_dev(t56);
    			if (detaching) detach_dev(textarea);
    			if (detaching) detach_dev(t57);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PostScout', slots, []);
    	let defenseRating = 0;
    	let drivingRating = 2;
    	let defenseDuration = 0;
    	let recDefenseDuration = 0;
    	let sauceRating = 1;
    	let intakeRating = 1;
    	let badStatus = false;
    	let commentText = "";
    	let matchStageValue;

    	function shiftBad() {
    		$$invalidate(6, badStatus = !badStatus);
    	}

    	const defDurSub = playDefenseDuration.subscribe(value => {
    		$$invalidate(2, defenseDuration = value);
    	});

    	const recDefDurSub = receiveDefenseDuration.subscribe(value => {
    		$$invalidate(3, recDefenseDuration = value);
    	});

    	const defRatingSub = playDefenseQuality.subscribe(value => {
    		$$invalidate(0, defenseRating = value);
    	});

    	const errorSub = error.subscribe(value => {
    		$$invalidate(6, badStatus = value);
    	});

    	const intakeSub = intakeQuality.subscribe(value => {
    		$$invalidate(5, intakeRating = value);
    	});

    	const commentSub = comment.subscribe(value => {
    		$$invalidate(7, commentText = value);
    	});

    	const drivingSub = drivingQuality.subscribe(value => {
    		$$invalidate(1, drivingRating = value);
    	});

    	const sauceSub = sauceQuality.subscribe(value => {
    		$$invalidate(4, sauceRating = value);
    	});

    	const matchStageSub = matchStage.subscribe(value => {
    		matchStageValue = value;
    	});

    	function updateStores() {
    		playDefenseDuration.update(n => defenseDuration);
    		receiveDefenseDuration.update(n => recDefenseDuration);
    		playDefenseQuality.update(n => defenseRating);
    		error.update(n => badStatus);
    		intakeQuality.update(n => intakeRating);
    		comment.update(n => commentText);
    		drivingQuality.update(n => drivingRating);
    		sauceQuality.update(n => sauceRating);
    	}

    	function QRTime() {
    		matchStage.update(n => matchStageValue + 1);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PostScout> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[], [], [], []];

    	function input0_change_input_handler() {
    		defenseDuration = to_number(this.value);
    		$$invalidate(2, defenseDuration);
    	}

    	function input1_change_handler() {
    		defenseRating = this.__value;
    		$$invalidate(0, defenseRating);
    	}

    	function input2_change_handler() {
    		defenseRating = this.__value;
    		$$invalidate(0, defenseRating);
    	}

    	function input3_change_handler() {
    		defenseRating = this.__value;
    		$$invalidate(0, defenseRating);
    	}

    	function input4_change_handler() {
    		defenseRating = this.__value;
    		$$invalidate(0, defenseRating);
    	}

    	function input5_change_handler() {
    		defenseRating = this.__value;
    		$$invalidate(0, defenseRating);
    	}

    	function input6_change_handler() {
    		defenseRating = this.__value;
    		$$invalidate(0, defenseRating);
    	}

    	function input7_change_handler() {
    		defenseRating = this.__value;
    		$$invalidate(0, defenseRating);
    	}

    	function input8_change_handler() {
    		defenseRating = this.__value;
    		$$invalidate(0, defenseRating);
    	}

    	function input9_change_handler() {
    		defenseRating = this.__value;
    		$$invalidate(0, defenseRating);
    	}

    	function input10_change_handler() {
    		defenseRating = this.__value;
    		$$invalidate(0, defenseRating);
    	}

    	function input11_change_handler() {
    		defenseRating = this.__value;
    		$$invalidate(0, defenseRating);
    	}

    	function input12_change_input_handler() {
    		recDefenseDuration = to_number(this.value);
    		$$invalidate(3, recDefenseDuration);
    	}

    	function input13_change_handler() {
    		drivingRating = this.__value;
    		$$invalidate(1, drivingRating);
    	}

    	function input14_change_handler() {
    		drivingRating = this.__value;
    		$$invalidate(1, drivingRating);
    	}

    	function input15_change_handler() {
    		drivingRating = this.__value;
    		$$invalidate(1, drivingRating);
    	}

    	function input16_change_handler() {
    		drivingRating = this.__value;
    		$$invalidate(1, drivingRating);
    	}

    	function input17_change_handler() {
    		drivingRating = this.__value;
    		$$invalidate(1, drivingRating);
    	}

    	function input18_change_handler() {
    		drivingRating = this.__value;
    		$$invalidate(1, drivingRating);
    	}

    	function input19_change_handler() {
    		drivingRating = this.__value;
    		$$invalidate(1, drivingRating);
    	}

    	function input20_change_handler() {
    		drivingRating = this.__value;
    		$$invalidate(1, drivingRating);
    	}

    	function input21_change_handler() {
    		drivingRating = this.__value;
    		$$invalidate(1, drivingRating);
    	}

    	function input22_change_handler() {
    		drivingRating = this.__value;
    		$$invalidate(1, drivingRating);
    	}

    	function input23_change_handler() {
    		drivingRating = this.__value;
    		$$invalidate(1, drivingRating);
    	}

    	function input24_change_handler() {
    		sauceRating = this.__value;
    		$$invalidate(4, sauceRating);
    	}

    	function input25_change_handler() {
    		sauceRating = this.__value;
    		$$invalidate(4, sauceRating);
    	}

    	function input26_change_handler() {
    		sauceRating = this.__value;
    		$$invalidate(4, sauceRating);
    	}

    	function input27_change_handler() {
    		sauceRating = this.__value;
    		$$invalidate(4, sauceRating);
    	}

    	function input28_change_handler() {
    		sauceRating = this.__value;
    		$$invalidate(4, sauceRating);
    	}

    	function input29_change_handler() {
    		sauceRating = this.__value;
    		$$invalidate(4, sauceRating);
    	}

    	function input30_change_handler() {
    		sauceRating = this.__value;
    		$$invalidate(4, sauceRating);
    	}

    	function input31_change_handler() {
    		sauceRating = this.__value;
    		$$invalidate(4, sauceRating);
    	}

    	function input32_change_handler() {
    		sauceRating = this.__value;
    		$$invalidate(4, sauceRating);
    	}

    	function input33_change_handler() {
    		sauceRating = this.__value;
    		$$invalidate(4, sauceRating);
    	}

    	function input34_change_handler() {
    		sauceRating = this.__value;
    		$$invalidate(4, sauceRating);
    	}

    	function input35_change_handler() {
    		intakeRating = this.__value;
    		$$invalidate(5, intakeRating);
    	}

    	function input36_change_handler() {
    		intakeRating = this.__value;
    		$$invalidate(5, intakeRating);
    	}

    	function input37_change_handler() {
    		intakeRating = this.__value;
    		$$invalidate(5, intakeRating);
    	}

    	function input38_change_handler() {
    		intakeRating = this.__value;
    		$$invalidate(5, intakeRating);
    	}

    	function input39_change_handler() {
    		intakeRating = this.__value;
    		$$invalidate(5, intakeRating);
    	}

    	function input40_change_handler() {
    		intakeRating = this.__value;
    		$$invalidate(5, intakeRating);
    	}

    	function input41_change_handler() {
    		intakeRating = this.__value;
    		$$invalidate(5, intakeRating);
    	}

    	function input42_change_handler() {
    		intakeRating = this.__value;
    		$$invalidate(5, intakeRating);
    	}

    	function input43_change_handler() {
    		intakeRating = this.__value;
    		$$invalidate(5, intakeRating);
    	}

    	function input44_change_handler() {
    		intakeRating = this.__value;
    		$$invalidate(5, intakeRating);
    	}

    	function input45_change_handler() {
    		intakeRating = this.__value;
    		$$invalidate(5, intakeRating);
    	}

    	function textarea_input_handler() {
    		commentText = this.value;
    		$$invalidate(7, commentText);
    	}

    	$$self.$capture_state = () => ({
    		playDefenseDuration,
    		playDefenseQuality,
    		error,
    		receiveDefenseDuration,
    		intakeQuality,
    		comment,
    		drivingQuality,
    		sauceQuality,
    		matchStage,
    		defenseRating,
    		drivingRating,
    		defenseDuration,
    		recDefenseDuration,
    		sauceRating,
    		intakeRating,
    		badStatus,
    		commentText,
    		matchStageValue,
    		shiftBad,
    		defDurSub,
    		recDefDurSub,
    		defRatingSub,
    		errorSub,
    		intakeSub,
    		commentSub,
    		drivingSub,
    		sauceSub,
    		matchStageSub,
    		updateStores,
    		QRTime
    	});

    	$$self.$inject_state = $$props => {
    		if ('defenseRating' in $$props) $$invalidate(0, defenseRating = $$props.defenseRating);
    		if ('drivingRating' in $$props) $$invalidate(1, drivingRating = $$props.drivingRating);
    		if ('defenseDuration' in $$props) $$invalidate(2, defenseDuration = $$props.defenseDuration);
    		if ('recDefenseDuration' in $$props) $$invalidate(3, recDefenseDuration = $$props.recDefenseDuration);
    		if ('sauceRating' in $$props) $$invalidate(4, sauceRating = $$props.sauceRating);
    		if ('intakeRating' in $$props) $$invalidate(5, intakeRating = $$props.intakeRating);
    		if ('badStatus' in $$props) $$invalidate(6, badStatus = $$props.badStatus);
    		if ('commentText' in $$props) $$invalidate(7, commentText = $$props.commentText);
    		if ('matchStageValue' in $$props) matchStageValue = $$props.matchStageValue;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*defenseDuration, recDefenseDuration, defenseRating, badStatus, intakeRating, commentText, drivingRating, sauceRating*/ 255) {
    			{
    				updateStores();
    			}
    		}
    	};

    	return [
    		defenseRating,
    		drivingRating,
    		defenseDuration,
    		recDefenseDuration,
    		sauceRating,
    		intakeRating,
    		badStatus,
    		commentText,
    		shiftBad,
    		QRTime,
    		input0_change_input_handler,
    		input1_change_handler,
    		$$binding_groups,
    		input2_change_handler,
    		input3_change_handler,
    		input4_change_handler,
    		input5_change_handler,
    		input6_change_handler,
    		input7_change_handler,
    		input8_change_handler,
    		input9_change_handler,
    		input10_change_handler,
    		input11_change_handler,
    		input12_change_input_handler,
    		input13_change_handler,
    		input14_change_handler,
    		input15_change_handler,
    		input16_change_handler,
    		input17_change_handler,
    		input18_change_handler,
    		input19_change_handler,
    		input20_change_handler,
    		input21_change_handler,
    		input22_change_handler,
    		input23_change_handler,
    		input24_change_handler,
    		input25_change_handler,
    		input26_change_handler,
    		input27_change_handler,
    		input28_change_handler,
    		input29_change_handler,
    		input30_change_handler,
    		input31_change_handler,
    		input32_change_handler,
    		input33_change_handler,
    		input34_change_handler,
    		input35_change_handler,
    		input36_change_handler,
    		input37_change_handler,
    		input38_change_handler,
    		input39_change_handler,
    		input40_change_handler,
    		input41_change_handler,
    		input42_change_handler,
    		input43_change_handler,
    		input44_change_handler,
    		input45_change_handler,
    		textarea_input_handler
    	];
    }

    class PostScout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {}, null, [-1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostScout",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /*
     * QRious v4.0.2
     * Copyright (C) 2017 Alasdair Mercer
     * Copyright (C) 2010 Tom Zerucha
     *
     * This program is free software: you can redistribute it and/or modify
     * it under the terms of the GNU General Public License as published by
     * the Free Software Foundation, either version 3 of the License, or
     * (at your option) any later version.
     *
     * This program is distributed in the hope that it will be useful,
     * but WITHOUT ANY WARRANTY; without even the implied warranty of
     * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     * GNU General Public License for more details.
     *
     * You should have received a copy of the GNU General Public License
     * along with this program.  If not, see <http://www.gnu.org/licenses/>.
     */

    var qrcode = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
        module.exports = factory() ;
      }(commonjsGlobal, (function () {  
        /*
         * Copyright (C) 2017 Alasdair Mercer, !ninja
         *
         * Permission is hereby granted, free of charge, to any person obtaining a copy
         * of this software and associated documentation files (the "Software"), to deal
         * in the Software without restriction, including without limitation the rights
         * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
         * copies of the Software, and to permit persons to whom the Software is
         * furnished to do so, subject to the following conditions:
         *
         * The above copyright notice and this permission notice shall be included in all
         * copies or substantial portions of the Software.
         *
         * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
         * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
         * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
         * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
         * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
         * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
         * SOFTWARE.
         */
      
        /**
         * A bare-bones constructor for surrogate prototype swapping.
         *
         * @private
         * @constructor
         */
        var Constructor = /* istanbul ignore next */ function() {};
        /**
         * A reference to <code>Object.prototype.hasOwnProperty</code>.
         *
         * @private
         * @type {Function}
         */
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        /**
         * A reference to <code>Array.prototype.slice</code>.
         *
         * @private
         * @type {Function}
         */
        var slice = Array.prototype.slice;
      
        /**
         * Creates an object which inherits the given <code>prototype</code>.
         *
         * Optionally, the created object can be extended further with the specified <code>properties</code>.
         *
         * @param {Object} prototype - the prototype to be inherited by the created object
         * @param {Object} [properties] - the optional properties to be extended by the created object
         * @return {Object} The newly created object.
         * @private
         */
        function createObject(prototype, properties) {
          var result;
          /* istanbul ignore next */
          if (typeof Object.create === 'function') {
            result = Object.create(prototype);
          } else {
            Constructor.prototype = prototype;
            result = new Constructor();
            Constructor.prototype = null;
          }
      
          if (properties) {
            extendObject(true, result, properties);
          }
      
          return result;
        }
      
        /**
         * Extends the constructor to which this method is associated with the <code>prototype</code> and/or
         * <code>statics</code> provided.
         *
         * If <code>name</code> is provided, it will be used as the class name and can be accessed via a special
         * <code>class_</code> property on the child constructor, otherwise the class name of the super constructor will be used
         * instead. The class name may also be used string representation for instances of the child constructor (via
         * <code>toString</code>), but this is not applicable to the <i>lite</i> version of Nevis.
         *
         * If <code>constructor</code> is provided, it will be used as the constructor for the child, otherwise a simple
         * constructor which only calls the super constructor will be used instead.
         *
         * The super constructor can be accessed via a special <code>super_</code> property on the child constructor.
         *
         * @param {string} [name=this.class_] - the class name to be used for the child constructor
         * @param {Function} [constructor] - the constructor for the child
         * @param {Object} [prototype] - the prototype properties to be defined for the child
         * @param {Object} [statics] - the static properties to be defined for the child
         * @return {Function} The child <code>constructor</code> provided or the one created if none was given.
         * @public
         */
        function extend(name, constructor, prototype, statics) {
          var superConstructor = this;
      
          if (typeof name !== 'string') {
            statics = prototype;
            prototype = constructor;
            constructor = name;
            name = null;
          }
      
          if (typeof constructor !== 'function') {
            statics = prototype;
            prototype = constructor;
            constructor = function() {
              return superConstructor.apply(this, arguments);
            };
          }
      
          extendObject(false, constructor, superConstructor, statics);
      
          constructor.prototype = createObject(superConstructor.prototype, prototype);
          constructor.prototype.constructor = constructor;
      
          constructor.class_ = name || superConstructor.class_;
          constructor.super_ = superConstructor;
      
          return constructor;
        }
      
        /**
         * Extends the specified <code>target</code> object with the properties in each of the <code>sources</code> provided.
         *
         * if any source is <code>null</code> it will be ignored.
         *
         * @param {boolean} own - <code>true</code> to only copy <b>own</b> properties from <code>sources</code> onto
         * <code>target</code>; otherwise <code>false</code>
         * @param {Object} target - the target object which should be extended
         * @param {...Object} [sources] - the source objects whose properties are to be copied onto <code>target</code>
         * @return {void}
         * @private
         */
        function extendObject(own, target, sources) {
          sources = slice.call(arguments, 2);
      
          var property;
          var source;
      
          for (var i = 0, length = sources.length; i < length; i++) {
            source = sources[i];
      
            for (property in source) {
              if (!own || hasOwnProperty.call(source, property)) {
                target[property] = source[property];
              }
            }
          }
        }
      
        var extend_1 = extend;
      
        /**
         * The base class from which all others should extend.
         *
         * @public
         * @constructor
         */
        function Nevis() {}
        Nevis.class_ = 'Nevis';
        Nevis.super_ = Object;
      
        /**
         * Extends the constructor to which this method is associated with the <code>prototype</code> and/or
         * <code>statics</code> provided.
         *
         * If <code>name</code> is provided, it will be used as the class name and can be accessed via a special
         * <code>class_</code> property on the child constructor, otherwise the class name of the super constructor will be used
         * instead. The class name may also be used string representation for instances of the child constructor (via
         * <code>toString</code>), but this is not applicable to the <i>lite</i> version of Nevis.
         *
         * If <code>constructor</code> is provided, it will be used as the constructor for the child, otherwise a simple
         * constructor which only calls the super constructor will be used instead.
         *
         * The super constructor can be accessed via a special <code>super_</code> property on the child constructor.
         *
         * @param {string} [name=this.class_] - the class name to be used for the child constructor
         * @param {Function} [constructor] - the constructor for the child
         * @param {Object} [prototype] - the prototype properties to be defined for the child
         * @param {Object} [statics] - the static properties to be defined for the child
         * @return {Function} The child <code>constructor</code> provided or the one created if none was given.
         * @public
         * @static
         * @memberof Nevis
         */
        Nevis.extend = extend_1;
      
        var nevis = Nevis;
      
        var lite = nevis;
      
        /**
         * Responsible for rendering a QR code {@link Frame} on a specific type of element.
         *
         * A renderer may be dependant on the rendering of another element, so the ordering of their execution is important.
         *
         * The rendering of a element can be deferred by disabling the renderer initially, however, any attempt get the element
         * from the renderer will result in it being immediately enabled and the element being rendered.
         *
         * @param {QRious} qrious - the {@link QRious} instance to be used
         * @param {*} element - the element onto which the QR code is to be rendered
         * @param {boolean} [enabled] - <code>true</code> this {@link Renderer} is enabled; otherwise <code>false</code>.
         * @public
         * @class
         * @extends Nevis
         */
        var Renderer = lite.extend(function(qrious, element, enabled) {
          /**
           * The {@link QRious} instance.
           *
           * @protected
           * @type {QRious}
           * @memberof Renderer#
           */
          this.qrious = qrious;
      
          /**
           * The element onto which this {@link Renderer} is rendering the QR code.
           *
           * @protected
           * @type {*}
           * @memberof Renderer#
           */
          this.element = element;
          this.element.qrious = qrious;
      
          /**
           * Whether this {@link Renderer} is enabled.
           *
           * @protected
           * @type {boolean}
           * @memberof Renderer#
           */
          this.enabled = Boolean(enabled);
        }, {
      
          /**
           * Draws the specified QR code <code>frame</code> on the underlying element.
           *
           * Implementations of {@link Renderer} <b>must</b> override this method with their own specific logic.
           *
           * @param {Frame} frame - the {@link Frame} to be drawn
           * @return {void}
           * @protected
           * @abstract
           * @memberof Renderer#
           */
          draw: function(frame) {},
      
          /**
           * Returns the element onto which this {@link Renderer} is rendering the QR code.
           *
           * If this method is called while this {@link Renderer} is disabled, it will be immediately enabled and rendered
           * before the element is returned.
           *
           * @return {*} The element.
           * @public
           * @memberof Renderer#
           */
          getElement: function() {
            if (!this.enabled) {
              this.enabled = true;
              this.render();
            }
      
            return this.element;
          },
      
          /**
           * Calculates the size (in pixel units) to represent an individual module within the QR code based on the
           * <code>frame</code> provided.
           *
           * Any configured padding will be excluded from the returned size.
           *
           * The returned value will be at least one, even in cases where the size of the QR code does not fit its contents.
           * This is done so that the inevitable clipping is handled more gracefully since this way at least something is
           * displayed instead of just a blank space filled by the background color.
           *
           * @param {Frame} frame - the {@link Frame} from which the module size is to be derived
           * @return {number} The pixel size for each module in the QR code which will be no less than one.
           * @protected
           * @memberof Renderer#
           */
          getModuleSize: function(frame) {
            var qrious = this.qrious;
            var padding = qrious.padding || 0;
            var pixels = Math.floor((qrious.size - (padding * 2)) / frame.width);
      
            return Math.max(1, pixels);
          },

          /**
           * Renders a QR code on the underlying element based on the <code>frame</code> provided.
           *
           * @param {Frame} frame - the {@link Frame} to be rendered
           * @return {void}
           * @public
           * @memberof Renderer#
           */
          render: function(frame) {
            if (this.enabled) {
              this.resize();
              this.reset();
              this.draw(frame);
            }
          },
      
          /**
           * Resets the underlying element, effectively clearing any previously rendered QR code.
           *
           * Implementations of {@link Renderer} <b>must</b> override this method with their own specific logic.
           *
           * @return {void}
           * @protected
           * @abstract
           * @memberof Renderer#
           */
          reset: function() {},
      
          /**
           * Ensures that the size of the underlying element matches that defined on the associated {@link QRious} instance.
           *
           * Implementations of {@link Renderer} <b>must</b> override this method with their own specific logic.
           *
           * @return {void}
           * @protected
           * @abstract
           * @memberof Renderer#
           */
          resize: function() {}
      
        });
      
        var Renderer_1 = Renderer;
      
        /**
         * An implementation of {@link Renderer} for working with <code>canvas</code> elements.
         *
         * @public
         * @class
         * @extends Renderer
         */
        var CanvasRenderer = Renderer_1.extend({
      
          /**
           * @override
           */
          draw: function(frame) {
            var i, j;
            var qrious = this.qrious;
            var moduleSize = this.getModuleSize(frame);
            var offset = parseInt((this.element.width-(frame.width * moduleSize)) / 2);
            var context = this.element.getContext('2d');
      
            context.fillStyle = qrious.foreground;
            context.globalAlpha = qrious.foregroundAlpha;
      
            for (i = 0; i < frame.width; i++) {
              for (j = 0; j < frame.width; j++) {
                if (frame.buffer[(j * frame.width) + i]) {
                  context.fillRect((moduleSize * i) + offset, (moduleSize * j) + offset, moduleSize, moduleSize);
                }
              }
            }
          },
      
          /**
           * @override
           */
          reset: function() {
            var qrious = this.qrious;
            var context = this.element.getContext('2d');
            var size = qrious.size;
      
            context.lineWidth = 1;
            context.clearRect(0, 0, size, size);
            context.fillStyle = qrious.background;
            context.globalAlpha = qrious.backgroundAlpha;
            context.fillRect(0, 0, size, size);
          },
      
          /**
           * @override
           */
          resize: function() {
            var element = this.element;
      
            element.width = element.height = this.qrious.size;
          }
      
        });
      
        var CanvasRenderer_1 = CanvasRenderer;
      
        /* eslint no-multi-spaces: "off" */
      
      
      
        /**
         * Contains alignment pattern information.
         *
         * @public
         * @class
         * @extends Nevis
         */
        var Alignment = lite.extend(null, {
      
          /**
           * The alignment pattern block.
           *
           * @public
           * @static
           * @type {number[]}
           * @memberof Alignment
           */
          BLOCK: [
            0,  11, 15, 19, 23, 27, 31,
            16, 18, 20, 22, 24, 26, 28, 20, 22, 24, 24, 26, 28, 28, 22, 24, 24,
            26, 26, 28, 28, 24, 24, 26, 26, 26, 28, 28, 24, 26, 26, 26, 28, 28
          ]
      
        });
      
        var Alignment_1 = Alignment;
      
        /* eslint no-multi-spaces: "off" */
      
      
      
        /**
         * Contains error correction information.
         *
         * @public
         * @class
         * @extends Nevis
         */
        var ErrorCorrection = lite.extend(null, {
      
          /**
           * The error correction blocks.
           *
           * There are four elements per version. The first two indicate the number of blocks, then the data width, and finally
           * the ECC width.
           *
           * @public
           * @static
           * @type {number[]}
           * @memberof ErrorCorrection
           */
          BLOCKS: [
            1,  0,  19,  7,     1,  0,  16,  10,    1,  0,  13,  13,    1,  0,  9,   17,
            1,  0,  34,  10,    1,  0,  28,  16,    1,  0,  22,  22,    1,  0,  16,  28,
            1,  0,  55,  15,    1,  0,  44,  26,    2,  0,  17,  18,    2,  0,  13,  22,
            1,  0,  80,  20,    2,  0,  32,  18,    2,  0,  24,  26,    4,  0,  9,   16,
            1,  0,  108, 26,    2,  0,  43,  24,    2,  2,  15,  18,    2,  2,  11,  22,
            2,  0,  68,  18,    4,  0,  27,  16,    4,  0,  19,  24,    4,  0,  15,  28,
            2,  0,  78,  20,    4,  0,  31,  18,    2,  4,  14,  18,    4,  1,  13,  26,
            2,  0,  97,  24,    2,  2,  38,  22,    4,  2,  18,  22,    4,  2,  14,  26,
            2,  0,  116, 30,    3,  2,  36,  22,    4,  4,  16,  20,    4,  4,  12,  24,
            2,  2,  68,  18,    4,  1,  43,  26,    6,  2,  19,  24,    6,  2,  15,  28,
            4,  0,  81,  20,    1,  4,  50,  30,    4,  4,  22,  28,    3,  8,  12,  24,
            2,  2,  92,  24,    6,  2,  36,  22,    4,  6,  20,  26,    7,  4,  14,  28,
            4,  0,  107, 26,    8,  1,  37,  22,    8,  4,  20,  24,    12, 4,  11,  22,
            3,  1,  115, 30,    4,  5,  40,  24,    11, 5,  16,  20,    11, 5,  12,  24,
            5,  1,  87,  22,    5,  5,  41,  24,    5,  7,  24,  30,    11, 7,  12,  24,
            5,  1,  98,  24,    7,  3,  45,  28,    15, 2,  19,  24,    3,  13, 15,  30,
            1,  5,  107, 28,    10, 1,  46,  28,    1,  15, 22,  28,    2,  17, 14,  28,
            5,  1,  120, 30,    9,  4,  43,  26,    17, 1,  22,  28,    2,  19, 14,  28,
            3,  4,  113, 28,    3,  11, 44,  26,    17, 4,  21,  26,    9,  16, 13,  26,
            3,  5,  107, 28,    3,  13, 41,  26,    15, 5,  24,  30,    15, 10, 15,  28,
            4,  4,  116, 28,    17, 0,  42,  26,    17, 6,  22,  28,    19, 6,  16,  30,
            2,  7,  111, 28,    17, 0,  46,  28,    7,  16, 24,  30,    34, 0,  13,  24,
            4,  5,  121, 30,    4,  14, 47,  28,    11, 14, 24,  30,    16, 14, 15,  30,
            6,  4,  117, 30,    6,  14, 45,  28,    11, 16, 24,  30,    30, 2,  16,  30,
            8,  4,  106, 26,    8,  13, 47,  28,    7,  22, 24,  30,    22, 13, 15,  30,
            10, 2,  114, 28,    19, 4,  46,  28,    28, 6,  22,  28,    33, 4,  16,  30,
            8,  4,  122, 30,    22, 3,  45,  28,    8,  26, 23,  30,    12, 28, 15,  30,
            3,  10, 117, 30,    3,  23, 45,  28,    4,  31, 24,  30,    11, 31, 15,  30,
            7,  7,  116, 30,    21, 7,  45,  28,    1,  37, 23,  30,    19, 26, 15,  30,
            5,  10, 115, 30,    19, 10, 47,  28,    15, 25, 24,  30,    23, 25, 15,  30,
            13, 3,  115, 30,    2,  29, 46,  28,    42, 1,  24,  30,    23, 28, 15,  30,
            17, 0,  115, 30,    10, 23, 46,  28,    10, 35, 24,  30,    19, 35, 15,  30,
            17, 1,  115, 30,    14, 21, 46,  28,    29, 19, 24,  30,    11, 46, 15,  30,
            13, 6,  115, 30,    14, 23, 46,  28,    44, 7,  24,  30,    59, 1,  16,  30,
            12, 7,  121, 30,    12, 26, 47,  28,    39, 14, 24,  30,    22, 41, 15,  30,
            6,  14, 121, 30,    6,  34, 47,  28,    46, 10, 24,  30,    2,  64, 15,  30,
            17, 4,  122, 30,    29, 14, 46,  28,    49, 10, 24,  30,    24, 46, 15,  30,
            4,  18, 122, 30,    13, 32, 46,  28,    48, 14, 24,  30,    42, 32, 15,  30,
            20, 4,  117, 30,    40, 7,  47,  28,    43, 22, 24,  30,    10, 67, 15,  30,
            19, 6,  118, 30,    18, 31, 47,  28,    34, 34, 24,  30,    20, 61, 15,  30
          ],
      
          /**
           * The final format bits with mask (level << 3 | mask).
           *
           * @public
           * @static
           * @type {number[]}
           * @memberof ErrorCorrection
           */
          FINAL_FORMAT: [
            // L
            0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976,
            // M
            0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,
            // Q
            0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed,
            // H
            0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b
          ],
      
          /**
           * A map of human-readable ECC levels.
           *
           * @public
           * @static
           * @type {Object.<string, number>}
           * @memberof ErrorCorrection
           */
          LEVELS: {
            L: 1,
            M: 2,
            Q: 3,
            H: 4
          }
      
        });
      
        var ErrorCorrection_1 = ErrorCorrection;
      
        /**
         * Contains Galois field information.
         *
         * @public
         * @class
         * @extends Nevis
         */
        var Galois = lite.extend(null, {
      
          /**
           * The Galois field exponent table.
           *
           * @public
           * @static
           * @type {number[]}
           * @memberof Galois
           */
          EXPONENT: [
            0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1d, 0x3a, 0x74, 0xe8, 0xcd, 0x87, 0x13, 0x26,
            0x4c, 0x98, 0x2d, 0x5a, 0xb4, 0x75, 0xea, 0xc9, 0x8f, 0x03, 0x06, 0x0c, 0x18, 0x30, 0x60, 0xc0,
            0x9d, 0x27, 0x4e, 0x9c, 0x25, 0x4a, 0x94, 0x35, 0x6a, 0xd4, 0xb5, 0x77, 0xee, 0xc1, 0x9f, 0x23,
            0x46, 0x8c, 0x05, 0x0a, 0x14, 0x28, 0x50, 0xa0, 0x5d, 0xba, 0x69, 0xd2, 0xb9, 0x6f, 0xde, 0xa1,
            0x5f, 0xbe, 0x61, 0xc2, 0x99, 0x2f, 0x5e, 0xbc, 0x65, 0xca, 0x89, 0x0f, 0x1e, 0x3c, 0x78, 0xf0,
            0xfd, 0xe7, 0xd3, 0xbb, 0x6b, 0xd6, 0xb1, 0x7f, 0xfe, 0xe1, 0xdf, 0xa3, 0x5b, 0xb6, 0x71, 0xe2,
            0xd9, 0xaf, 0x43, 0x86, 0x11, 0x22, 0x44, 0x88, 0x0d, 0x1a, 0x34, 0x68, 0xd0, 0xbd, 0x67, 0xce,
            0x81, 0x1f, 0x3e, 0x7c, 0xf8, 0xed, 0xc7, 0x93, 0x3b, 0x76, 0xec, 0xc5, 0x97, 0x33, 0x66, 0xcc,
            0x85, 0x17, 0x2e, 0x5c, 0xb8, 0x6d, 0xda, 0xa9, 0x4f, 0x9e, 0x21, 0x42, 0x84, 0x15, 0x2a, 0x54,
            0xa8, 0x4d, 0x9a, 0x29, 0x52, 0xa4, 0x55, 0xaa, 0x49, 0x92, 0x39, 0x72, 0xe4, 0xd5, 0xb7, 0x73,
            0xe6, 0xd1, 0xbf, 0x63, 0xc6, 0x91, 0x3f, 0x7e, 0xfc, 0xe5, 0xd7, 0xb3, 0x7b, 0xf6, 0xf1, 0xff,
            0xe3, 0xdb, 0xab, 0x4b, 0x96, 0x31, 0x62, 0xc4, 0x95, 0x37, 0x6e, 0xdc, 0xa5, 0x57, 0xae, 0x41,
            0x82, 0x19, 0x32, 0x64, 0xc8, 0x8d, 0x07, 0x0e, 0x1c, 0x38, 0x70, 0xe0, 0xdd, 0xa7, 0x53, 0xa6,
            0x51, 0xa2, 0x59, 0xb2, 0x79, 0xf2, 0xf9, 0xef, 0xc3, 0x9b, 0x2b, 0x56, 0xac, 0x45, 0x8a, 0x09,
            0x12, 0x24, 0x48, 0x90, 0x3d, 0x7a, 0xf4, 0xf5, 0xf7, 0xf3, 0xfb, 0xeb, 0xcb, 0x8b, 0x0b, 0x16,
            0x2c, 0x58, 0xb0, 0x7d, 0xfa, 0xe9, 0xcf, 0x83, 0x1b, 0x36, 0x6c, 0xd8, 0xad, 0x47, 0x8e, 0x00
          ],
      
          /**
           * The Galois field log table.
           *
           * @public
           * @static
           * @type {number[]}
           * @memberof Galois
           */
          LOG: [
            0xff, 0x00, 0x01, 0x19, 0x02, 0x32, 0x1a, 0xc6, 0x03, 0xdf, 0x33, 0xee, 0x1b, 0x68, 0xc7, 0x4b,
            0x04, 0x64, 0xe0, 0x0e, 0x34, 0x8d, 0xef, 0x81, 0x1c, 0xc1, 0x69, 0xf8, 0xc8, 0x08, 0x4c, 0x71,
            0x05, 0x8a, 0x65, 0x2f, 0xe1, 0x24, 0x0f, 0x21, 0x35, 0x93, 0x8e, 0xda, 0xf0, 0x12, 0x82, 0x45,
            0x1d, 0xb5, 0xc2, 0x7d, 0x6a, 0x27, 0xf9, 0xb9, 0xc9, 0x9a, 0x09, 0x78, 0x4d, 0xe4, 0x72, 0xa6,
            0x06, 0xbf, 0x8b, 0x62, 0x66, 0xdd, 0x30, 0xfd, 0xe2, 0x98, 0x25, 0xb3, 0x10, 0x91, 0x22, 0x88,
            0x36, 0xd0, 0x94, 0xce, 0x8f, 0x96, 0xdb, 0xbd, 0xf1, 0xd2, 0x13, 0x5c, 0x83, 0x38, 0x46, 0x40,
            0x1e, 0x42, 0xb6, 0xa3, 0xc3, 0x48, 0x7e, 0x6e, 0x6b, 0x3a, 0x28, 0x54, 0xfa, 0x85, 0xba, 0x3d,
            0xca, 0x5e, 0x9b, 0x9f, 0x0a, 0x15, 0x79, 0x2b, 0x4e, 0xd4, 0xe5, 0xac, 0x73, 0xf3, 0xa7, 0x57,
            0x07, 0x70, 0xc0, 0xf7, 0x8c, 0x80, 0x63, 0x0d, 0x67, 0x4a, 0xde, 0xed, 0x31, 0xc5, 0xfe, 0x18,
            0xe3, 0xa5, 0x99, 0x77, 0x26, 0xb8, 0xb4, 0x7c, 0x11, 0x44, 0x92, 0xd9, 0x23, 0x20, 0x89, 0x2e,
            0x37, 0x3f, 0xd1, 0x5b, 0x95, 0xbc, 0xcf, 0xcd, 0x90, 0x87, 0x97, 0xb2, 0xdc, 0xfc, 0xbe, 0x61,
            0xf2, 0x56, 0xd3, 0xab, 0x14, 0x2a, 0x5d, 0x9e, 0x84, 0x3c, 0x39, 0x53, 0x47, 0x6d, 0x41, 0xa2,
            0x1f, 0x2d, 0x43, 0xd8, 0xb7, 0x7b, 0xa4, 0x76, 0xc4, 0x17, 0x49, 0xec, 0x7f, 0x0c, 0x6f, 0xf6,
            0x6c, 0xa1, 0x3b, 0x52, 0x29, 0x9d, 0x55, 0xaa, 0xfb, 0x60, 0x86, 0xb1, 0xbb, 0xcc, 0x3e, 0x5a,
            0xcb, 0x59, 0x5f, 0xb0, 0x9c, 0xa9, 0xa0, 0x51, 0x0b, 0xf5, 0x16, 0xeb, 0x7a, 0x75, 0x2c, 0xd7,
            0x4f, 0xae, 0xd5, 0xe9, 0xe6, 0xe7, 0xad, 0xe8, 0x74, 0xd6, 0xf4, 0xea, 0xa8, 0x50, 0x58, 0xaf
          ]
      
        });
      
        var Galois_1 = Galois;
      
        /**
         * Contains version pattern information.
         *
         * @public
         * @class
         * @extends Nevis
         */
        var Version = lite.extend(null, {
      
          /**
           * The version pattern block.
           *
           * @public
           * @static
           * @type {number[]}
           * @memberof Version
           */
          BLOCK: [
            0xc94, 0x5bc, 0xa99, 0x4d3, 0xbf6, 0x762, 0x847, 0x60d, 0x928, 0xb78, 0x45d, 0xa17, 0x532,
            0x9a6, 0x683, 0x8c9, 0x7ec, 0xec4, 0x1e1, 0xfab, 0x08e, 0xc1a, 0x33f, 0xd75, 0x250, 0x9d5,
            0x6f0, 0x8ba, 0x79f, 0xb0b, 0x42e, 0xa64, 0x541, 0xc69
          ]
      
        });
      
        var Version_1 = Version;
      
        /**
         * Generates information for a QR code frame based on a specific value to be encoded.
         *
         * @param {Frame~Options} options - the options to be used
         * @public
         * @class
         * @extends Nevis
         */
        var Frame = lite.extend(function(options) {
          var dataBlock, eccBlock, index, neccBlock1, neccBlock2;
          var valueLength = options.value.length;
      
          this._badness = [];
          this._level = ErrorCorrection_1.LEVELS[options.level];
          this._polynomial = [];
          this._value = options.value;
          this._version = 0;
          this._stringBuffer = [];
      
          while (this._version < 40) {
            this._version++;
      
            index = ((this._level - 1) * 4) + ((this._version - 1) * 16);
      
            neccBlock1 = ErrorCorrection_1.BLOCKS[index++];
            neccBlock2 = ErrorCorrection_1.BLOCKS[index++];
            dataBlock = ErrorCorrection_1.BLOCKS[index++];
            eccBlock = ErrorCorrection_1.BLOCKS[index];
      
            index = (dataBlock * (neccBlock1 + neccBlock2)) + neccBlock2 - 3 + (this._version <= 9);
      
            if (valueLength <= index) {
              break;
            }
          }
      
          this._dataBlock = dataBlock;
          this._eccBlock = eccBlock;
          this._neccBlock1 = neccBlock1;
          this._neccBlock2 = neccBlock2;
      
          /**
           * The data width is based on version.
           *
           * @public
           * @type {number}
           * @memberof Frame#
           */
          // FIXME: Ensure that it fits instead of being truncated.
          var width = this.width = 17 + (4 * this._version);
      
          /**
           * The image buffer.
           *
           * @public
           * @type {number[]}
           * @memberof Frame#
           */
          this.buffer = Frame._createArray(width * width);
      
          this._ecc = Frame._createArray(dataBlock + ((dataBlock + eccBlock) * (neccBlock1 + neccBlock2)) + neccBlock2);
          this._mask = Frame._createArray(((width * (width + 1)) + 1) / 2);
      
          this._insertFinders();
          this._insertAlignments();
      
          // Insert single foreground cell.
          this.buffer[8 + (width * (width - 8))] = 1;
      
          this._insertTimingGap();
          this._reverseMask();
          this._insertTimingRowAndColumn();
          this._insertVersion();
          this._syncMask();
          this._convertBitStream(valueLength);
          this._calculatePolynomial();
          this._appendEccToData();
          this._interleaveBlocks();
          this._pack();
          this._finish();
        }, {
      
          _addAlignment: function(x, y) {
            var i;
            var buffer = this.buffer;
            var width = this.width;
      
            buffer[x + (width * y)] = 1;
      
            for (i = -2; i < 2; i++) {
              buffer[x + i + (width * (y - 2))] = 1;
              buffer[x - 2 + (width * (y + i + 1))] = 1;
              buffer[x + 2 + (width * (y + i))] = 1;
              buffer[x + i + 1 + (width * (y + 2))] = 1;
            }
      
            for (i = 0; i < 2; i++) {
              this._setMask(x - 1, y + i);
              this._setMask(x + 1, y - i);
              this._setMask(x - i, y - 1);
              this._setMask(x + i, y + 1);
            }
          },
      
          _appendData: function(data, dataLength, ecc, eccLength) {
            var bit, i, j;
            var polynomial = this._polynomial;
            var stringBuffer = this._stringBuffer;
      
            for (i = 0; i < eccLength; i++) {
              stringBuffer[ecc + i] = 0;
            }
      
            for (i = 0; i < dataLength; i++) {
              bit = Galois_1.LOG[stringBuffer[data + i] ^ stringBuffer[ecc]];
      
              if (bit !== 255) {
                for (j = 1; j < eccLength; j++) {
                  stringBuffer[ecc + j - 1] = stringBuffer[ecc + j] ^
                    Galois_1.EXPONENT[Frame._modN(bit + polynomial[eccLength - j])];
                }
              } else {
                for (j = ecc; j < ecc + eccLength; j++) {
                  stringBuffer[j] = stringBuffer[j + 1];
                }
              }
      
              stringBuffer[ecc + eccLength - 1] = bit === 255 ? 0 : Galois_1.EXPONENT[Frame._modN(bit + polynomial[0])];
            }
          },
      
          _appendEccToData: function() {
            var i;
            var data = 0;
            var dataBlock = this._dataBlock;
            var ecc = this._calculateMaxLength();
            var eccBlock = this._eccBlock;
      
            for (i = 0; i < this._neccBlock1; i++) {
              this._appendData(data, dataBlock, ecc, eccBlock);
      
              data += dataBlock;
              ecc += eccBlock;
            }
      
            for (i = 0; i < this._neccBlock2; i++) {
              this._appendData(data, dataBlock + 1, ecc, eccBlock);
      
              data += dataBlock + 1;
              ecc += eccBlock;
            }
          },
      
          _applyMask: function(mask) {
            var r3x, r3y, x, y;
            var buffer = this.buffer;
            var width = this.width;
      
            switch (mask) {
            case 0:
              for (y = 0; y < width; y++) {
                for (x = 0; x < width; x++) {
                  if (!((x + y) & 1) && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            case 1:
              for (y = 0; y < width; y++) {
                for (x = 0; x < width; x++) {
                  if (!(y & 1) && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            case 2:
              for (y = 0; y < width; y++) {
                for (r3x = 0, x = 0; x < width; x++, r3x++) {
                  if (r3x === 3) {
                    r3x = 0;
                  }
      
                  if (!r3x && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            case 3:
              for (r3y = 0, y = 0; y < width; y++, r3y++) {
                if (r3y === 3) {
                  r3y = 0;
                }
      
                for (r3x = r3y, x = 0; x < width; x++, r3x++) {
                  if (r3x === 3) {
                    r3x = 0;
                  }
      
                  if (!r3x && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            case 4:
              for (y = 0; y < width; y++) {
                for (r3x = 0, r3y = (y >> 1) & 1, x = 0; x < width; x++, r3x++) {
                  if (r3x === 3) {
                    r3x = 0;
                    r3y = !r3y;
                  }
      
                  if (!r3y && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            case 5:
              for (r3y = 0, y = 0; y < width; y++, r3y++) {
                if (r3y === 3) {
                  r3y = 0;
                }
      
                for (r3x = 0, x = 0; x < width; x++, r3x++) {
                  if (r3x === 3) {
                    r3x = 0;
                  }
      
                  if (!((x & y & 1) + !(!r3x | !r3y)) && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            case 6:
              for (r3y = 0, y = 0; y < width; y++, r3y++) {
                if (r3y === 3) {
                  r3y = 0;
                }
      
                for (r3x = 0, x = 0; x < width; x++, r3x++) {
                  if (r3x === 3) {
                    r3x = 0;
                  }
      
                  if (!((x & y & 1) + (r3x && r3x === r3y) & 1) && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            case 7:
              for (r3y = 0, y = 0; y < width; y++, r3y++) {
                if (r3y === 3) {
                  r3y = 0;
                }
      
                for (r3x = 0, x = 0; x < width; x++, r3x++) {
                  if (r3x === 3) {
                    r3x = 0;
                  }
      
                  if (!((r3x && r3x === r3y) + (x + y & 1) & 1) && !this._isMasked(x, y)) {
                    buffer[x + (y * width)] ^= 1;
                  }
                }
              }
      
              break;
            }
          },
      
          _calculateMaxLength: function() {
            return (this._dataBlock * (this._neccBlock1 + this._neccBlock2)) + this._neccBlock2;
          },
      
          _calculatePolynomial: function() {
            var i, j;
            var eccBlock = this._eccBlock;
            var polynomial = this._polynomial;
      
            polynomial[0] = 1;
      
            for (i = 0; i < eccBlock; i++) {
              polynomial[i + 1] = 1;
      
              for (j = i; j > 0; j--) {
                polynomial[j] = polynomial[j] ? polynomial[j - 1] ^
                  Galois_1.EXPONENT[Frame._modN(Galois_1.LOG[polynomial[j]] + i)] : polynomial[j - 1];
              }
      
              polynomial[0] = Galois_1.EXPONENT[Frame._modN(Galois_1.LOG[polynomial[0]] + i)];
            }
      
            // Use logs for generator polynomial to save calculation step.
            for (i = 0; i <= eccBlock; i++) {
              polynomial[i] = Galois_1.LOG[polynomial[i]];
            }
          },
      
          _checkBadness: function() {
            var b, b1, h, x, y;
            var bad = 0;
            var badness = this._badness;
            var buffer = this.buffer;
            var width = this.width;
      
            // Blocks of same colour.
            for (y = 0; y < width - 1; y++) {
              for (x = 0; x < width - 1; x++) {
                // All foreground colour.
                if ((buffer[x + (width * y)] &&
                  buffer[x + 1 + (width * y)] &&
                  buffer[x + (width * (y + 1))] &&
                  buffer[x + 1 + (width * (y + 1))]) ||
                  // All background colour.
                  !(buffer[x + (width * y)] ||
                  buffer[x + 1 + (width * y)] ||
                  buffer[x + (width * (y + 1))] ||
                  buffer[x + 1 + (width * (y + 1))])) {
                  bad += Frame.N2;
                }
              }
            }
      
            var bw = 0;
      
            // X runs.
            for (y = 0; y < width; y++) {
              h = 0;
      
              badness[0] = 0;
      
              for (b = 0, x = 0; x < width; x++) {
                b1 = buffer[x + (width * y)];
      
                if (b === b1) {
                  badness[h]++;
                } else {
                  badness[++h] = 1;
                }
      
                b = b1;
                bw += b ? 1 : -1;
              }
      
              bad += this._getBadness(h);
            }
      
            if (bw < 0) {
              bw = -bw;
            }
      
            var count = 0;
            var big = bw;
            big += big << 2;
            big <<= 1;
      
            while (big > width * width) {
              big -= width * width;
              count++;
            }
      
            bad += count * Frame.N4;
      
            // Y runs.
            for (x = 0; x < width; x++) {
              h = 0;
      
              badness[0] = 0;
      
              for (b = 0, y = 0; y < width; y++) {
                b1 = buffer[x + (width * y)];
      
                if (b === b1) {
                  badness[h]++;
                } else {
                  badness[++h] = 1;
                }
      
                b = b1;
              }
      
              bad += this._getBadness(h);
            }
      
            return bad;
          },
      
          _convertBitStream: function(length) {
            var bit, i;
            var ecc = this._ecc;
            var version = this._version;
      
            // Convert string to bit stream. 8-bit data to QR-coded 8-bit data (numeric, alphanumeric, or kanji not supported).
            for (i = 0; i < length; i++) {
              ecc[i] = this._value.charCodeAt(i);
            }
      
            var stringBuffer = this._stringBuffer = ecc.slice();
            var maxLength = this._calculateMaxLength();
      
            if (length >= maxLength - 2) {
              length = maxLength - 2;
      
              if (version > 9) {
                length--;
              }
            }
      
            // Shift and re-pack to insert length prefix.
            var index = length;
      
            if (version > 9) {
              stringBuffer[index + 2] = 0;
              stringBuffer[index + 3] = 0;
      
              while (index--) {
                bit = stringBuffer[index];
      
                stringBuffer[index + 3] |= 255 & (bit << 4);
                stringBuffer[index + 2] = bit >> 4;
              }
      
              stringBuffer[2] |= 255 & (length << 4);
              stringBuffer[1] = length >> 4;
              stringBuffer[0] = 0x40 | (length >> 12);
            } else {
              stringBuffer[index + 1] = 0;
              stringBuffer[index + 2] = 0;
      
              while (index--) {
                bit = stringBuffer[index];
      
                stringBuffer[index + 2] |= 255 & (bit << 4);
                stringBuffer[index + 1] = bit >> 4;
              }
      
              stringBuffer[1] |= 255 & (length << 4);
              stringBuffer[0] = 0x40 | (length >> 4);
            }
      
            // Fill to end with pad pattern.
            index = length + 3 - (version < 10);
      
            while (index < maxLength) {
              stringBuffer[index++] = 0xec;
              stringBuffer[index++] = 0x11;
            }
          },
      
          _getBadness: function(length) {
            var i;
            var badRuns = 0;
            var badness = this._badness;
      
            for (i = 0; i <= length; i++) {
              if (badness[i] >= 5) {
                badRuns += Frame.N1 + badness[i] - 5;
              }
            }
      
            // FBFFFBF as in finder.
            for (i = 3; i < length - 1; i += 2) {
              if (badness[i - 2] === badness[i + 2] &&
                badness[i + 2] === badness[i - 1] &&
                badness[i - 1] === badness[i + 1] &&
                badness[i - 1] * 3 === badness[i] &&
                // Background around the foreground pattern? Not part of the specs.
                (badness[i - 3] === 0 || i + 3 > length ||
                badness[i - 3] * 3 >= badness[i] * 4 ||
                badness[i + 3] * 3 >= badness[i] * 4)) {
                badRuns += Frame.N3;
              }
            }
      
            return badRuns;
          },
      
          _finish: function() {
            // Save pre-mask copy of frame.
            this._stringBuffer = this.buffer.slice();
      
            var currentMask, i;
            var bit = 0;
            var mask = 30000;
      
            /*
             * Using for instead of while since in original Arduino code if an early mask was "good enough" it wouldn't try for
             * a better one since they get more complex and take longer.
             */
            for (i = 0; i < 8; i++) {
              // Returns foreground-background imbalance.
              this._applyMask(i);
      
              currentMask = this._checkBadness();
      
              // Is current mask better than previous best?
              if (currentMask < mask) {
                mask = currentMask;
                bit = i;
              }
      
              // Don't increment "i" to a void redoing mask.
              if (bit === 7) {
                break;
              }
      
              // Reset for next pass.
              this.buffer = this._stringBuffer.slice();
            }
      
            // Redo best mask as none were "good enough" (i.e. last wasn't bit).
            if (bit !== i) {
              this._applyMask(bit);
            }
      
            // Add in final mask/ECC level bytes.
            mask = ErrorCorrection_1.FINAL_FORMAT[bit + (this._level - 1 << 3)];
      
            var buffer = this.buffer;
            var width = this.width;
      
            // Low byte.
            for (i = 0; i < 8; i++, mask >>= 1) {
              if (mask & 1) {
                buffer[width - 1 - i + (width * 8)] = 1;
      
                if (i < 6) {
                  buffer[8 + (width * i)] = 1;
                } else {
                  buffer[8 + (width * (i + 1))] = 1;
                }
              }
            }
      
            // High byte.
            for (i = 0; i < 7; i++, mask >>= 1) {
              if (mask & 1) {
                buffer[8 + (width * (width - 7 + i))] = 1;
      
                if (i) {
                  buffer[6 - i + (width * 8)] = 1;
                } else {
                  buffer[7 + (width * 8)] = 1;
                }
              }
            }
          },
      
          _interleaveBlocks: function() {
            var i, j;
            var dataBlock = this._dataBlock;
            var ecc = this._ecc;
            var eccBlock = this._eccBlock;
            var k = 0;
            var maxLength = this._calculateMaxLength();
            var neccBlock1 = this._neccBlock1;
            var neccBlock2 = this._neccBlock2;
            var stringBuffer = this._stringBuffer;
      
            for (i = 0; i < dataBlock; i++) {
              for (j = 0; j < neccBlock1; j++) {
                ecc[k++] = stringBuffer[i + (j * dataBlock)];
              }
      
              for (j = 0; j < neccBlock2; j++) {
                ecc[k++] = stringBuffer[(neccBlock1 * dataBlock) + i + (j * (dataBlock + 1))];
              }
            }
      
            for (j = 0; j < neccBlock2; j++) {
              ecc[k++] = stringBuffer[(neccBlock1 * dataBlock) + i + (j * (dataBlock + 1))];
            }
      
            for (i = 0; i < eccBlock; i++) {
              for (j = 0; j < neccBlock1 + neccBlock2; j++) {
                ecc[k++] = stringBuffer[maxLength + i + (j * eccBlock)];
              }
            }
      
            this._stringBuffer = ecc;
          },
      
          _insertAlignments: function() {
            var i, x, y;
            var version = this._version;
            var width = this.width;
      
            if (version > 1) {
              i = Alignment_1.BLOCK[version];
              y = width - 7;
      
              for (;;) {
                x = width - 7;
      
                while (x > i - 3) {
                  this._addAlignment(x, y);
      
                  if (x < i) {
                    break;
                  }
      
                  x -= i;
                }
      
                if (y <= i + 9) {
                  break;
                }
      
                y -= i;
      
                this._addAlignment(6, y);
                this._addAlignment(y, 6);
              }
            }
          },
      
          _insertFinders: function() {
            var i, j, x, y;
            var buffer = this.buffer;
            var width = this.width;
      
            for (i = 0; i < 3; i++) {
              j = 0;
              y = 0;
      
              if (i === 1) {
                j = width - 7;
              }
              if (i === 2) {
                y = width - 7;
              }
      
              buffer[y + 3 + (width * (j + 3))] = 1;
      
              for (x = 0; x < 6; x++) {
                buffer[y + x + (width * j)] = 1;
                buffer[y + (width * (j + x + 1))] = 1;
                buffer[y + 6 + (width * (j + x))] = 1;
                buffer[y + x + 1 + (width * (j + 6))] = 1;
              }
      
              for (x = 1; x < 5; x++) {
                this._setMask(y + x, j + 1);
                this._setMask(y + 1, j + x + 1);
                this._setMask(y + 5, j + x);
                this._setMask(y + x + 1, j + 5);
              }
      
              for (x = 2; x < 4; x++) {
                buffer[y + x + (width * (j + 2))] = 1;
                buffer[y + 2 + (width * (j + x + 1))] = 1;
                buffer[y + 4 + (width * (j + x))] = 1;
                buffer[y + x + 1 + (width * (j + 4))] = 1;
              }
            }
          },
      
          _insertTimingGap: function() {
            var x, y;
            var width = this.width;
      
            for (y = 0; y < 7; y++) {
              this._setMask(7, y);
              this._setMask(width - 8, y);
              this._setMask(7, y + width - 7);
            }
      
            for (x = 0; x < 8; x++) {
              this._setMask(x, 7);
              this._setMask(x + width - 8, 7);
              this._setMask(x, width - 8);
            }
          },
      
          _insertTimingRowAndColumn: function() {
            var x;
            var buffer = this.buffer;
            var width = this.width;
      
            for (x = 0; x < width - 14; x++) {
              if (x & 1) {
                this._setMask(8 + x, 6);
                this._setMask(6, 8 + x);
              } else {
                buffer[8 + x + (width * 6)] = 1;
                buffer[6 + (width * (8 + x))] = 1;
              }
            }
          },
      
          _insertVersion: function() {
            var i, j, x, y;
            var buffer = this.buffer;
            var version = this._version;
            var width = this.width;
      
            if (version > 6) {
              i = Version_1.BLOCK[version - 7];
              j = 17;
      
              for (x = 0; x < 6; x++) {
                for (y = 0; y < 3; y++, j--) {
                  if (1 & (j > 11 ? version >> j - 12 : i >> j)) {
                    buffer[5 - x + (width * (2 - y + width - 11))] = 1;
                    buffer[2 - y + width - 11 + (width * (5 - x))] = 1;
                  } else {
                    this._setMask(5 - x, 2 - y + width - 11);
                    this._setMask(2 - y + width - 11, 5 - x);
                  }
                }
              }
            }
          },
      
          _isMasked: function(x, y) {
            var bit = Frame._getMaskBit(x, y);
      
            return this._mask[bit] === 1;
          },
      
          _pack: function() {
            var bit, i, j;
            var k = 1;
            var v = 1;
            var width = this.width;
            var x = width - 1;
            var y = width - 1;
      
            // Interleaved data and ECC codes.
            var length = ((this._dataBlock + this._eccBlock) * (this._neccBlock1 + this._neccBlock2)) + this._neccBlock2;
      
            for (i = 0; i < length; i++) {
              bit = this._stringBuffer[i];
      
              for (j = 0; j < 8; j++, bit <<= 1) {
                if (0x80 & bit) {
                  this.buffer[x + (width * y)] = 1;
                }
      
                // Find next fill position.
                do {
                  if (v) {
                    x--;
                  } else {
                    x++;
      
                    if (k) {
                      if (y !== 0) {
                        y--;
                      } else {
                        x -= 2;
                        k = !k;
      
                        if (x === 6) {
                          x--;
                          y = 9;
                        }
                      }
                    } else if (y !== width - 1) {
                      y++;
                    } else {
                      x -= 2;
                      k = !k;
      
                      if (x === 6) {
                        x--;
                        y -= 8;
                      }
                    }
                  }
      
                  v = !v;
                } while (this._isMasked(x, y));
              }
            }
          },
      
          _reverseMask: function() {
            var x, y;
            var width = this.width;
      
            for (x = 0; x < 9; x++) {
              this._setMask(x, 8);
            }
      
            for (x = 0; x < 8; x++) {
              this._setMask(x + width - 8, 8);
              this._setMask(8, x);
            }
      
            for (y = 0; y < 7; y++) {
              this._setMask(8, y + width - 7);
            }
          },
      
          _setMask: function(x, y) {
            var bit = Frame._getMaskBit(x, y);
      
            this._mask[bit] = 1;
          },
      
          _syncMask: function() {
            var x, y;
            var width = this.width;
      
            for (y = 0; y < width; y++) {
              for (x = 0; x <= y; x++) {
                if (this.buffer[x + (width * y)]) {
                  this._setMask(x, y);
                }
              }
            }
          }
      
        }, {
      
          _createArray: function(length) {
            var i;
            var array = [];
      
            for (i = 0; i < length; i++) {
              array[i] = 0;
            }
      
            return array;
          },
      
          _getMaskBit: function(x, y) {
            var bit;
      
            if (x > y) {
              bit = x;
              x = y;
              y = bit;
            }
      
            bit = y;
            bit += y * y;
            bit >>= 1;
            bit += x;
      
            return bit;
          },
      
          _modN: function(x) {
            while (x >= 255) {
              x -= 255;
              x = (x >> 8) + (x & 255);
            }
      
            return x;
          },
      
          // *Badness* coefficients.
          N1: 3,
          N2: 3,
          N3: 40,
          N4: 10
      
        });
      
        var Frame_1 = Frame;
      
        /**
         * The options used by {@link Frame}.
         *
         * @typedef {Object} Frame~Options
         * @property {string} level - The ECC level to be used.
         * @property {string} value - The value to be encoded.
         */
      
        /**
         * An implementation of {@link Renderer} for working with <code>img</code> elements.
         *
         * This depends on {@link CanvasRenderer} being executed first as this implementation simply applies the data URL from
         * the rendered <code>canvas</code> element as the <code>src</code> for the <code>img</code> element being rendered.
         *
         * @public
         * @class
         * @extends Renderer
         */
        var ImageRenderer = Renderer_1.extend({
      
          /**
           * @override
           */
          draw: function() {
            this.element.src = this.qrious.toDataURL();
          },
      
          /**
           * @override
           */
          reset: function() {
            this.element.src = '';
          },
      
          /**
           * @override
           */
          resize: function() {
            var element = this.element;
      
            element.width = element.height = this.qrious.size;
          }
      
        });
      
        var ImageRenderer_1 = ImageRenderer;
      
        /**
         * Defines an available option while also configuring how values are applied to the target object.
         *
         * Optionally, a default value can be specified as well a value transformer for greater control over how the option
         * value is applied.
         *
         * If no value transformer is specified, then any specified option will be applied directly. All values are maintained
         * on the target object itself as a field using the option name prefixed with a single underscore.
         *
         * When an option is specified as modifiable, the {@link OptionManager} will be required to include a setter for the
         * property that is defined on the target object that uses the option name.
         *
         * @param {string} name - the name to be used
         * @param {boolean} [modifiable] - <code>true</code> if the property defined on target objects should include a setter;
         * otherwise <code>false</code>
         * @param {*} [defaultValue] - the default value to be used
         * @param {Option~ValueTransformer} [valueTransformer] - the value transformer to be used
         * @public
         * @class
         * @extends Nevis
         */
        var Option = lite.extend(function(name, modifiable, defaultValue, valueTransformer) {
          /**
           * The name for this {@link Option}.
           *
           * @public
           * @type {string}
           * @memberof Option#
           */
          this.name = name;
      
          /**
           * Whether a setter should be included on the property defined on target objects for this {@link Option}.
           *
           * @public
           * @type {boolean}
           * @memberof Option#
           */
          this.modifiable = Boolean(modifiable);
      
          /**
           * The default value for this {@link Option}.
           *
           * @public
           * @type {*}
           * @memberof Option#
           */
          this.defaultValue = defaultValue;
      
          this._valueTransformer = valueTransformer;
        }, {
      
          /**
           * Transforms the specified <code>value</code> so that it can be applied for this {@link Option}.
           *
           * If a value transformer has been specified for this {@link Option}, it will be called upon to transform
           * <code>value</code>. Otherwise, <code>value</code> will be returned directly.
           *
           * @param {*} value - the value to be transformed
           * @return {*} The transformed value or <code>value</code> if no value transformer is specified.
           * @public
           * @memberof Option#
           */
          transform: function(value) {
            var transformer = this._valueTransformer;
            if (typeof transformer === 'function') {
              return transformer(value, this);
            }
      
            return value;
          }
      
        });
      
        var Option_1 = Option;
      
        /**
         * Returns a transformed value for the specified <code>value</code> to be applied for the <code>option</code> provided.
         *
         * @callback Option~ValueTransformer
         * @param {*} value - the value to be transformed
         * @param {Option} option - the {@link Option} for which <code>value</code> is being transformed
         * @return {*} The transform value.
         */
      
        /**
         * Contains utility methods that are useful throughout the library.
         *
         * @public
         * @class
         * @extends Nevis
         */
        var Utilities = lite.extend(null, {
      
          /**
           * Returns the absolute value of a given number.
           *
           * This method is simply a convenient shorthand for <code>Math.abs</code> while ensuring that nulls are returned as
           * <code>null</code> instead of zero.
           *
           * @param {number} value - the number whose absolute value is to be returned
           * @return {number} The absolute value of <code>value</code> or <code>null</code> if <code>value</code> is
           * <code>null</code>.
           * @public
           * @static
           * @memberof Utilities
           */
          abs: function(value) {
            return value != null ? Math.abs(value) : null;
          },
      
          /**
           * Returns whether the specified <code>object</code> has a property with the specified <code>name</code> as an own
           * (not inherited) property.
           *
           * @param {Object} object - the object on which the property is to be checked
           * @param {string} name - the name of the property to be checked
           * @return {boolean} <code>true</code> if <code>object</code> has an own property with <code>name</code>.
           * @public
           * @static
           * @memberof Utilities
           */
          hasOwn: function(object, name) {
            return Object.prototype.hasOwnProperty.call(object, name);
          },
      
          /**
           * A non-operation method that does absolutely nothing.
           *
           * @return {void}
           * @public
           * @static
           * @memberof Utilities
           */
          noop: function() {},
      
          /**
           * Transforms the specified <code>string</code> to upper case while remaining null-safe.
           *
           * @param {string} string - the string to be transformed to upper case
           * @return {string} <code>string</code> transformed to upper case if <code>string</code> is not <code>null</code>.
           * @public
           * @static
           * @memberof Utilities
           */
          toUpperCase: function(string) {
            return string != null ? string.toUpperCase() : null;
          }
      
        });
      
        var Utilities_1 = Utilities;
      
        /**
         * Manages multiple {@link Option} instances that are intended to be used by multiple implementations.
         *
         * Although the option definitions are shared between targets, the values are maintained on the targets themselves.
         *
         * @param {Option[]} options - the options to be used
         * @public
         * @class
         * @extends Nevis
         */
        var OptionManager = lite.extend(function(options) {
          /**
           * The available options for this {@link OptionManager}.
           *
           * @public
           * @type {Object.<string, Option>}
           * @memberof OptionManager#
           */
          this.options = {};
      
          options.forEach(function(option) {
            this.options[option.name] = option;
          }, this);
        }, {
      
          /**
           * Returns whether an option with the specified <code>name</code> is available.
           *
           * @param {string} name - the name of the {@link Option} whose existence is to be checked
           * @return {boolean} <code>true</code> if an {@link Option} exists with <code>name</code>; otherwise
           * <code>false</code>.
           * @public
           * @memberof OptionManager#
           */
          exists: function(name) {
            return this.options[name] != null;
          },
      
          /**
           * Returns the value of the option with the specified <code>name</code> on the <code>target</code> object provided.
           *
           * @param {string} name - the name of the {@link Option} whose value on <code>target</code> is to be returned
           * @param {Object} target - the object from which the value of the named {@link Option} is to be returned
           * @return {*} The value of the {@link Option} with <code>name</code> on <code>target</code>.
           * @public
           * @memberof OptionManager#
           */
          get: function(name, target) {
            return OptionManager._get(this.options[name], target);
          },
      
          /**
           * Returns a copy of all of the available options on the <code>target</code> object provided.
           *
           * @param {Object} target - the object from which the option name/value pairs are to be returned
           * @return {Object.<string, *>} A hash containing the name/value pairs of all options on <code>target</code>.
           * @public
           * @memberof OptionManager#
           */
          getAll: function(target) {
            var name;
            var options = this.options;
            var result = {};
      
            for (name in options) {
              if (Utilities_1.hasOwn(options, name)) {
                result[name] = OptionManager._get(options[name], target);
              }
            }
      
            return result;
          },
      
          /**
           * Initializes the available options for the <code>target</code> object provided and then applies the initial values
           * within the speciifed <code>options</code>.
           *
           * This method will throw an error if any of the names within <code>options</code> does not match an available option.
           *
           * This involves setting the default values and defining properties for all of the available options on
           * <code>target</code> before finally calling {@link OptionMananger#setAll} with <code>options</code> and
           * <code>target</code>. Any options that are configured to be modifiable will have a setter included in their defined
           * property that will allow its corresponding value to be modified.
           *
           * If a change handler is specified, it will be called whenever the value changes on <code>target</code> for a
           * modifiable option, but only when done so via the defined property's setter.
           *
           * @param {Object.<string, *>} options - the name/value pairs of the initial options to be set
           * @param {Object} target - the object on which the options are to be initialized
           * @param {Function} [changeHandler] - the function to be called whenever the value of an modifiable option changes on
           * <code>target</code>
           * @return {void}
           * @throws {Error} If <code>options</code> contains an invalid option name.
           * @public
           * @memberof OptionManager#
           */
          init: function(options, target, changeHandler) {
            if (typeof changeHandler !== 'function') {
              changeHandler = Utilities_1.noop;
            }
      
            var name, option;
      
            for (name in this.options) {
              if (Utilities_1.hasOwn(this.options, name)) {
                option = this.options[name];
      
                OptionManager._set(option, option.defaultValue, target);
                OptionManager._createAccessor(option, target, changeHandler);
              }
            }
      
            this._setAll(options, target, true);
          },
      
          /**
           * Sets the value of the option with the specified <code>name</code> on the <code>target</code> object provided to
           * <code>value</code>.
           *
           * This method will throw an error if <code>name</code> does not match an available option or matches an option that
           * cannot be modified.
           *
           * If <code>value</code> is <code>null</code> and the {@link Option} has a default value configured, then that default
           * value will be used instead. If the {@link Option} also has a value transformer configured, it will be used to
           * transform whichever value was determined to be used.
           *
           * This method returns whether the value of the underlying field on <code>target</code> was changed as a result.
           *
           * @param {string} name - the name of the {@link Option} whose value is to be set
           * @param {*} value - the value to be set for the named {@link Option} on <code>target</code>
           * @param {Object} target - the object on which <code>value</code> is to be set for the named {@link Option}
           * @return {boolean} <code>true</code> if the underlying field on <code>target</code> was changed; otherwise
           * <code>false</code>.
           * @throws {Error} If <code>name</code> is invalid or is for an option that cannot be modified.
           * @public
           * @memberof OptionManager#
           */
          set: function(name, value, target) {
            return this._set(name, value, target);
          },
      
          /**
           * Sets all of the specified <code>options</code> on the <code>target</code> object provided to their corresponding
           * values.
           *
           * This method will throw an error if any of the names within <code>options</code> does not match an available option
           * or matches an option that cannot be modified.
           *
           * If any value within <code>options</code> is <code>null</code> and the corresponding {@link Option} has a default
           * value configured, then that default value will be used instead. If an {@link Option} also has a value transformer
           * configured, it will be used to transform whichever value was determined to be used.
           *
           * This method returns whether the value for any of the underlying fields on <code>target</code> were changed as a
           * result.
           *
           * @param {Object.<string, *>} options - the name/value pairs of options to be set
           * @param {Object} target - the object on which the options are to be set
           * @return {boolean} <code>true</code> if any of the underlying fields on <code>target</code> were changed; otherwise
           * <code>false</code>.
           * @throws {Error} If <code>options</code> contains an invalid option name or an option that cannot be modiifed.
           * @public
           * @memberof OptionManager#
           */
          setAll: function(options, target) {
            return this._setAll(options, target);
          },
      
          _set: function(name, value, target, allowUnmodifiable) {
            var option = this.options[name];
            if (!option) {
              throw new Error('Invalid option: ' + name);
            }
            if (!option.modifiable && !allowUnmodifiable) {
              throw new Error('Option cannot be modified: ' + name);
            }
      
            return OptionManager._set(option, value, target);
          },
      
          _setAll: function(options, target, allowUnmodifiable) {
            if (!options) {
              return false;
            }
      
            var name;
            var changed = false;
      
            for (name in options) {
              if (Utilities_1.hasOwn(options, name) && this._set(name, options[name], target, allowUnmodifiable)) {
                changed = true;
              }
            }
      
            return changed;
          }
      
        }, {
      
          _createAccessor: function(option, target, changeHandler) {
            var descriptor = {
              get: function() {
                return OptionManager._get(option, target);
              }
            };
      
            if (option.modifiable) {
              descriptor.set = function(value) {
                if (OptionManager._set(option, value, target)) {
                  changeHandler(value, option);
                }
              };
            }
      
            Object.defineProperty(target, option.name, descriptor);
          },
      
          _get: function(option, target) {
            return target['_' + option.name];
          },
      
          _set: function(option, value, target) {
            var fieldName = '_' + option.name;
            var oldValue = target[fieldName];
            var newValue = option.transform(value != null ? value : option.defaultValue);
      
            target[fieldName] = newValue;
      
            return newValue !== oldValue;
          }
      
        });
      
        var OptionManager_1 = OptionManager;
      
        /**
         * Called whenever the value of a modifiable {@link Option} is changed on a target object via the defined property's
         * setter.
         *
         * @callback OptionManager~ChangeHandler
         * @param {*} value - the new value for <code>option</code> on the target object
         * @param {Option} option - the modifable {@link Option} whose value has changed on the target object.
         * @return {void}
         */
      
        /**
         * A basic manager for {@link Service} implementations that are mapped to simple names.
         *
         * @public
         * @class
         * @extends Nevis
         */
        var ServiceManager = lite.extend(function() {
          this._services = {};
        }, {
      
          /**
           * Returns the {@link Service} being managed with the specified <code>name</code>.
           *
           * @param {string} name - the name of the {@link Service} to be returned
           * @return {Service} The {@link Service} is being managed with <code>name</code>.
           * @throws {Error} If no {@link Service} is being managed with <code>name</code>.
           * @public
           * @memberof ServiceManager#
           */
          getService: function(name) {
            var service = this._services[name];
            if (!service) {
              throw new Error('Service is not being managed with name: ' + name);
            }
      
            return service;
          },
      
          /**
           * Sets the {@link Service} implementation to be managed for the specified <code>name</code> to the
           * <code>service</code> provided.
           *
           * @param {string} name - the name of the {@link Service} to be managed with <code>name</code>
           * @param {Service} service - the {@link Service} implementation to be managed
           * @return {void}
           * @throws {Error} If a {@link Service} is already being managed with the same <code>name</code>.
           * @public
           * @memberof ServiceManager#
           */
          setService: function(name, service) {
            if (this._services[name]) {
              throw new Error('Service is already managed with name: ' + name);
            }
      
            if (service) {
              this._services[name] = service;
            }
          }
      
        });
      
        var ServiceManager_1 = ServiceManager;
      
        var optionManager = new OptionManager_1([
          new Option_1('background', true, 'white'),
          new Option_1('backgroundAlpha', true, 1, Utilities_1.abs),
          new Option_1('element'),
          new Option_1('foreground', true, 'black'),
          new Option_1('foregroundAlpha', true, 1, Utilities_1.abs),
          new Option_1('level', true, 'L', Utilities_1.toUpperCase),
          new Option_1('mime', true, 'image/png'),
          new Option_1('padding', true, null, Utilities_1.abs),
          new Option_1('size', true, 100, Utilities_1.abs),
          new Option_1('value', true, '')
        ]);
        var serviceManager = new ServiceManager_1();
      
        /**
         * Enables configuration of a QR code generator which uses HTML5 <code>canvas</code> for rendering.
         *
         * @param {QRious~Options} [options] - the options to be used
         * @throws {Error} If any <code>options</code> are invalid.
         * @public
         * @class
         * @extends Nevis
         */
        var QRious = lite.extend(function(options) {
          optionManager.init(options, this, this.update.bind(this));
      
          var element = optionManager.get('element', this);
          var elementService = serviceManager.getService('element');
          var canvas = element && elementService.isCanvas(element) ? element : elementService.createCanvas();
          var image = element && elementService.isImage(element) ? element : elementService.createImage();
      
          this._canvasRenderer = new CanvasRenderer_1(this, canvas, true);
          this._imageRenderer = new ImageRenderer_1(this, image, image === element);
      
          this.update();
        }, {
      
          /**
           * Returns all of the options configured for this {@link QRious}.
           *
           * Any changes made to the returned object will not be reflected in the options themselves or their corresponding
           * underlying fields.
           *
           * @return {Object.<string, *>} A copy of the applied options.
           * @public
           * @memberof QRious#
           */
          get: function() {
            return optionManager.getAll(this);
          },
      
          /**
           * Sets all of the specified <code>options</code> and automatically updates this {@link QRious} if any of the
           * underlying fields are changed as a result.
           *
           * This is the preferred method for updating multiple options at one time to avoid unnecessary updates between
           * changes.
           *
           * @param {QRious~Options} options - the options to be set
           * @return {void}
           * @throws {Error} If any <code>options</code> are invalid or cannot be modified.
           * @public
           * @memberof QRious#
           */
          set: function(options) {
            if (optionManager.setAll(options, this)) {
              this.update();
            }
          },
      
          /**
           * Returns the image data URI for the generated QR code using the <code>mime</code> provided.
           *
           * @param {string} [mime] - the MIME type for the image
           * @return {string} The image data URI for the QR code.
           * @public
           * @memberof QRious#
           */
          toDataURL: function(mime) {
            return this.canvas.toDataURL(mime || this.mime);
          },
      
          /**
           * Updates this {@link QRious} by generating a new {@link Frame} and re-rendering the QR code.
           *
           * @return {void}
           * @protected
           * @memberof QRious#
           */
          update: function() {
            var frame = new Frame_1({
              level: this.level,
              value: this.value
            });
      
            this._canvasRenderer.render(frame);
            this._imageRenderer.render(frame);
          }
      
        }, {
      
          /**
           * Configures the <code>service</code> provided to be used by all {@link QRious} instances.
           *
           * @param {Service} service - the {@link Service} to be configured
           * @return {void}
           * @throws {Error} If a {@link Service} has already been configured with the same name.
           * @public
           * @static
           * @memberof QRious
           */
          use: function(service) {
            serviceManager.setService(service.getName(), service);
          }
      
        });
      
        Object.defineProperties(QRious.prototype, {
      
          canvas: {
            /**
             * Returns the <code>canvas</code> element being used to render the QR code for this {@link QRious}.
             *
             * @return {*} The <code>canvas</code> element.
             * @public
             * @memberof QRious#
             * @alias canvas
             */
            get: function() {
              return this._canvasRenderer.getElement();
            }
          },
      
          image: {
            /**
             * Returns the <code>img</code> element being used to render the QR code for this {@link QRious}.
             *
             * @return {*} The <code>img</code> element.
             * @public
             * @memberof QRious#
             * @alias image
             */
            get: function() {
              return this._imageRenderer.getElement();
            }
          }
      
        });
      
        var QRious_1$2 = QRious;
      
        /**
         * The options used by {@link QRious}.
         *
         * @typedef {Object} QRious~Options
         * @property {string} [background="white"] - The background color to be applied to the QR code.
         * @property {number} [backgroundAlpha=1] - The background alpha to be applied to the QR code.
         * @property {*} [element] - The element to be used to render the QR code which may either be an <code>canvas</code> or
         * <code>img</code>. The element(s) will be created if needed.
         * @property {string} [foreground="black"] - The foreground color to be applied to the QR code.
         * @property {number} [foregroundAlpha=1] - The foreground alpha to be applied to the QR code.
         * @property {string} [level="L"] - The error correction level to be applied to the QR code.
         * @property {string} [mime="image/png"] - The MIME type to be used to render the image for the QR code.
         * @property {number} [padding] - The padding for the QR code in pixels.
         * @property {number} [size=100] - The size of the QR code in pixels.
         * @property {string} [value=""] - The value to be encoded within the QR code.
         */
      
        var index = QRious_1$2;
      
        /**
         * Defines a service contract that must be met by all implementations.
         *
         * @public
         * @class
         * @extends Nevis
         */
        var Service = lite.extend({
      
          /**
           * Returns the name of this {@link Service}.
           *
           * @return {string} The service name.
           * @public
           * @abstract
           * @memberof Service#
           */
          getName: function() {}
      
        });
      
        var Service_1 = Service;
      
        /**
         * A service for working with elements.
         *
         * @public
         * @class
         * @extends Service
         */
        var ElementService = Service_1.extend({
      
          /**
           * Creates an instance of a canvas element.
           *
           * Implementations of {@link ElementService} <b>must</b> override this method with their own specific logic.
           *
           * @return {*} The newly created canvas element.
           * @public
           * @abstract
           * @memberof ElementService#
           */
          createCanvas: function() {},
      
          /**
           * Creates an instance of a image element.
           *
           * Implementations of {@link ElementService} <b>must</b> override this method with their own specific logic.
           *
           * @return {*} The newly created image element.
           * @public
           * @abstract
           * @memberof ElementService#
           */
          createImage: function() {},
      
          /**
           * @override
           */
          getName: function() {
            return 'element';
          },
      
          /**
           * Returns whether the specified <code>element</code> is a canvas.
           *
           * Implementations of {@link ElementService} <b>must</b> override this method with their own specific logic.
           *
           * @param {*} element - the element to be checked
           * @return {boolean} <code>true</code> if <code>element</code> is a canvas; otherwise <code>false</code>.
           * @public
           * @abstract
           * @memberof ElementService#
           */
          isCanvas: function(element) {},
      
          /**
           * Returns whether the specified <code>element</code> is an image.
           *
           * Implementations of {@link ElementService} <b>must</b> override this method with their own specific logic.
           *
           * @param {*} element - the element to be checked
           * @return {boolean} <code>true</code> if <code>element</code> is an image; otherwise <code>false</code>.
           * @public
           * @abstract
           * @memberof ElementService#
           */
          isImage: function(element) {}
      
        });
      
        var ElementService_1 = ElementService;
      
        /**
         * An implementation of {@link ElementService} intended for use within a browser environment.
         *
         * @public
         * @class
         * @extends ElementService
         */
        var BrowserElementService = ElementService_1.extend({
      
          /**
           * @override
           */
          createCanvas: function() {
            return document.createElement('canvas');
          },
      
          /**
           * @override
           */
          createImage: function() {
            return document.createElement('img');
          },
      
          /**
           * @override
           */
          isCanvas: function(element) {
            return element instanceof HTMLCanvasElement;
          },
      
          /**
           * @override
           */
          isImage: function(element) {
            return element instanceof HTMLImageElement;
          }
      
        });
      
        var BrowserElementService_1 = BrowserElementService;
      
        index.use(new BrowserElementService_1());
      
        var QRious_1 = index;
      
        return QRious_1;
      
      })));
    });

    /* node_modules\svelte-qrcode\src\lib\index.svelte generated by Svelte v3.48.0 */
    const file$3 = "node_modules\\svelte-qrcode\\src\\lib\\index.svelte";

    function create_fragment$3(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = /*image*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*value*/ ctx[0]);
    			attr_dev(img, "class", /*className*/ ctx[1]);
    			add_location(img, file$3, 41, 0, 681);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*image*/ 4 && !src_url_equal(img.src, img_src_value = /*image*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*value*/ 1) {
    				attr_dev(img, "alt", /*value*/ ctx[0]);
    			}

    			if (dirty & /*className*/ 2) {
    				attr_dev(img, "class", /*className*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Lib', slots, []);
    	const QRcode = new qrcode();
    	let { errorCorrection = "L" } = $$props;
    	let { background = "#fff" } = $$props;
    	let { color = "#000" } = $$props;
    	let { size = "200" } = $$props;
    	let { value = "" } = $$props;
    	let { padding = 0 } = $$props;
    	let { className = "qrcode" } = $$props;
    	let image = '';

    	function generateQrCode() {
    		QRcode.set({
    			background,
    			foreground: color,
    			level: errorCorrection,
    			padding,
    			size,
    			value
    		});

    		$$invalidate(2, image = QRcode.toDataURL('image/jpeg'));
    	}

    	onMount(() => {
    		generateQrCode();
    	});

    	const writable_props = [
    		'errorCorrection',
    		'background',
    		'color',
    		'size',
    		'value',
    		'padding',
    		'className'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Lib> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('errorCorrection' in $$props) $$invalidate(3, errorCorrection = $$props.errorCorrection);
    		if ('background' in $$props) $$invalidate(4, background = $$props.background);
    		if ('color' in $$props) $$invalidate(5, color = $$props.color);
    		if ('size' in $$props) $$invalidate(6, size = $$props.size);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('padding' in $$props) $$invalidate(7, padding = $$props.padding);
    		if ('className' in $$props) $$invalidate(1, className = $$props.className);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		QrCode: qrcode,
    		QRcode,
    		errorCorrection,
    		background,
    		color,
    		size,
    		value,
    		padding,
    		className,
    		image,
    		generateQrCode
    	});

    	$$self.$inject_state = $$props => {
    		if ('errorCorrection' in $$props) $$invalidate(3, errorCorrection = $$props.errorCorrection);
    		if ('background' in $$props) $$invalidate(4, background = $$props.background);
    		if ('color' in $$props) $$invalidate(5, color = $$props.color);
    		if ('size' in $$props) $$invalidate(6, size = $$props.size);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('padding' in $$props) $$invalidate(7, padding = $$props.padding);
    		if ('className' in $$props) $$invalidate(1, className = $$props.className);
    		if ('image' in $$props) $$invalidate(2, image = $$props.image);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value*/ 1) {
    			{
    				if (value) {
    					generateQrCode();
    				}
    			}
    		}
    	};

    	return [value, className, image, errorCorrection, background, color, size, padding];
    }

    class Lib extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			errorCorrection: 3,
    			background: 4,
    			color: 5,
    			size: 6,
    			value: 0,
    			padding: 7,
    			className: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lib",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get errorCorrection() {
    		throw new Error("<Lib>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set errorCorrection(value) {
    		throw new Error("<Lib>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get background() {
    		throw new Error("<Lib>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set background(value) {
    		throw new Error("<Lib>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Lib>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Lib>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Lib>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Lib>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Lib>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Lib>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get padding() {
    		throw new Error("<Lib>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padding(value) {
    		throw new Error("<Lib>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get className() {
    		throw new Error("<Lib>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set className(value) {
    		throw new Error("<Lib>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\QRGenPage.svelte generated by Svelte v3.48.0 */
    const file$2 = "src\\QRGenPage.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let qrcode;
    	let t0;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	qrcode = new Lib({
    			props: {
    				size: "440",
    				color: "#fbbf24",
    				background: "#171212",
    				errorCorrection: "Q",
    				value: /*qrString*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(qrcode.$$.fragment);
    			t0 = space();
    			button = element("button");
    			button.textContent = "Restart";
    			attr_dev(div, "class", "ml-[292px] mt-[30px] absolute");
    			add_location(div, file$2, 68, 0, 2389);
    			attr_dev(button, "class", "btn btn-square btn-success btn-outline w-[200px] h-[100px] ml-[775px] mt-[330px] text-xl");
    			add_location(button, file$2, 72, 0, 2539);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(qrcode, div, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*restart*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qrcode.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qrcode.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(qrcode);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $error;
    	let $intakeQuality;
    	let $sauceQuality;
    	let $drivingQuality;
    	let $receiveDefenseDuration;
    	let $playDefenseQuality;
    	let $playDefenseDuration;
    	let $climbSuccessLevel;
    	let $climbAttemptLevel;
    	let $teleLowerFail;
    	let $teleLowerScore;
    	let $teleUpperFail;
    	let $teleUpperScore;
    	let $autoLowerFail;
    	let $autoLowerScore;
    	let $autoUpperFail;
    	let $autoUpperScore;
    	let $taxi;
    	let $startPosY;
    	let $startPosX;
    	let $name;
    	let $teamNumber;
    	let $alliance;
    	let $comment;
    	validate_store(error, 'error');
    	component_subscribe($$self, error, $$value => $$invalidate(2, $error = $$value));
    	validate_store(intakeQuality, 'intakeQuality');
    	component_subscribe($$self, intakeQuality, $$value => $$invalidate(3, $intakeQuality = $$value));
    	validate_store(sauceQuality, 'sauceQuality');
    	component_subscribe($$self, sauceQuality, $$value => $$invalidate(4, $sauceQuality = $$value));
    	validate_store(drivingQuality, 'drivingQuality');
    	component_subscribe($$self, drivingQuality, $$value => $$invalidate(5, $drivingQuality = $$value));
    	validate_store(receiveDefenseDuration, 'receiveDefenseDuration');
    	component_subscribe($$self, receiveDefenseDuration, $$value => $$invalidate(6, $receiveDefenseDuration = $$value));
    	validate_store(playDefenseQuality, 'playDefenseQuality');
    	component_subscribe($$self, playDefenseQuality, $$value => $$invalidate(7, $playDefenseQuality = $$value));
    	validate_store(playDefenseDuration, 'playDefenseDuration');
    	component_subscribe($$self, playDefenseDuration, $$value => $$invalidate(8, $playDefenseDuration = $$value));
    	validate_store(climbSuccessLevel, 'climbSuccessLevel');
    	component_subscribe($$self, climbSuccessLevel, $$value => $$invalidate(9, $climbSuccessLevel = $$value));
    	validate_store(climbAttemptLevel, 'climbAttemptLevel');
    	component_subscribe($$self, climbAttemptLevel, $$value => $$invalidate(10, $climbAttemptLevel = $$value));
    	validate_store(teleLowerFail, 'teleLowerFail');
    	component_subscribe($$self, teleLowerFail, $$value => $$invalidate(11, $teleLowerFail = $$value));
    	validate_store(teleLowerScore, 'teleLowerScore');
    	component_subscribe($$self, teleLowerScore, $$value => $$invalidate(12, $teleLowerScore = $$value));
    	validate_store(teleUpperFail, 'teleUpperFail');
    	component_subscribe($$self, teleUpperFail, $$value => $$invalidate(13, $teleUpperFail = $$value));
    	validate_store(teleUpperScore, 'teleUpperScore');
    	component_subscribe($$self, teleUpperScore, $$value => $$invalidate(14, $teleUpperScore = $$value));
    	validate_store(autoLowerFail, 'autoLowerFail');
    	component_subscribe($$self, autoLowerFail, $$value => $$invalidate(15, $autoLowerFail = $$value));
    	validate_store(autoLowerScore, 'autoLowerScore');
    	component_subscribe($$self, autoLowerScore, $$value => $$invalidate(16, $autoLowerScore = $$value));
    	validate_store(autoUpperFail, 'autoUpperFail');
    	component_subscribe($$self, autoUpperFail, $$value => $$invalidate(17, $autoUpperFail = $$value));
    	validate_store(autoUpperScore, 'autoUpperScore');
    	component_subscribe($$self, autoUpperScore, $$value => $$invalidate(18, $autoUpperScore = $$value));
    	validate_store(taxi, 'taxi');
    	component_subscribe($$self, taxi, $$value => $$invalidate(19, $taxi = $$value));
    	validate_store(startPosY, 'startPosY');
    	component_subscribe($$self, startPosY, $$value => $$invalidate(20, $startPosY = $$value));
    	validate_store(startPosX, 'startPosX');
    	component_subscribe($$self, startPosX, $$value => $$invalidate(21, $startPosX = $$value));
    	validate_store(name, 'name');
    	component_subscribe($$self, name, $$value => $$invalidate(22, $name = $$value));
    	validate_store(teamNumber, 'teamNumber');
    	component_subscribe($$self, teamNumber, $$value => $$invalidate(23, $teamNumber = $$value));
    	validate_store(alliance, 'alliance');
    	component_subscribe($$self, alliance, $$value => $$invalidate(24, $alliance = $$value));
    	validate_store(comment, 'comment');
    	component_subscribe($$self, comment, $$value => $$invalidate(25, $comment = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('QRGenPage', slots, []);
    	let commentNoCommas = $comment.replaceAll(",", "");
    	let qrString = $alliance + "," + $teamNumber + "," + $name + "," + $startPosX + "," + $startPosY + "," + $taxi + "," + $autoUpperScore + "," + $autoUpperFail + "," + $autoLowerScore + "," + $autoLowerFail + "," + $teleUpperScore + "," + $teleUpperFail + "," + $teleLowerScore + "," + $teleLowerFail + "," + $climbAttemptLevel + "," + $climbSuccessLevel + "," + $playDefenseDuration + "," + $playDefenseQuality + "," + $receiveDefenseDuration + "," + $drivingQuality + "," + $sauceQuality + "," + $intakeQuality + "," + $error + "," + commentNoCommas;

    	function restart() {
    		alliance.update(n => "Red");
    		teamNumber.update(n => null);
    		name.update(n => "");
    		matchStageString.update(n => "auto");
    		taxi.update(n => false);
    		attentionAlert.update(n => false);
    		startPosX.update(n => -500);
    		startPosY.update(n => -500);
    		autoStage.update(n => 1);
    		autoUpperScore.update(n => 0);
    		autoUpperFail.update(n => 0);
    		autoLowerScore.update(n => 0);
    		autoLowerFail.update(n => 0);
    		teleUpperScore.update(n => 0);
    		teleUpperFail.update(n => 0);
    		teleLowerScore.update(n => 0);
    		teleLowerFail.update(n => 0);
    		climbAttemptLevel.update(n => 0);
    		climbSuccessLevel.update(n => 0);
    		playDefenseDuration.update(n => 0);
    		playDefenseQuality.update(n => 0);
    		receiveDefenseDuration.update(n => 0);
    		drivingQuality.update(n => 0);
    		sauceQuality.update(n => 0);
    		intakeQuality.update(n => 0);
    		error.update(n => false);
    		comment.update(n => "");
    		matchStage.update(n => 0);
    		autoNotif.update(n => false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<QRGenPage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		alliance,
    		teamNumber,
    		name,
    		matchStage,
    		taxi,
    		startPosX,
    		startPosY,
    		autoUpperScore,
    		autoUpperFail,
    		autoLowerScore,
    		autoLowerFail,
    		teleUpperScore,
    		teleUpperFail,
    		teleLowerScore,
    		teleLowerFail,
    		climbAttemptLevel,
    		climbSuccessLevel,
    		playDefenseDuration,
    		playDefenseQuality,
    		receiveDefenseDuration,
    		drivingQuality,
    		sauceQuality,
    		intakeQuality,
    		error,
    		comment,
    		matchStageString,
    		attentionAlert,
    		autoStage,
    		autoNotif,
    		QrCode: Lib,
    		commentNoCommas,
    		qrString,
    		restart,
    		$error,
    		$intakeQuality,
    		$sauceQuality,
    		$drivingQuality,
    		$receiveDefenseDuration,
    		$playDefenseQuality,
    		$playDefenseDuration,
    		$climbSuccessLevel,
    		$climbAttemptLevel,
    		$teleLowerFail,
    		$teleLowerScore,
    		$teleUpperFail,
    		$teleUpperScore,
    		$autoLowerFail,
    		$autoLowerScore,
    		$autoUpperFail,
    		$autoUpperScore,
    		$taxi,
    		$startPosY,
    		$startPosX,
    		$name,
    		$teamNumber,
    		$alliance,
    		$comment
    	});

    	$$self.$inject_state = $$props => {
    		if ('commentNoCommas' in $$props) commentNoCommas = $$props.commentNoCommas;
    		if ('qrString' in $$props) $$invalidate(0, qrString = $$props.qrString);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [qrString, restart];
    }

    class QRGenPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QRGenPage",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\StartPage.svelte generated by Svelte v3.48.0 */
    const file$1 = "src\\StartPage.svelte";

    // (42:8) {:else}
    function create_else_block$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Blue Alliance";
    			attr_dev(button, "class", "btn btn-outline btn-primary w-[260px] h-[75px] mt-3 text-2xl");
    			add_location(button, file$1, 42, 8, 1311);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*updateAlliance*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(42:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (40:4) {#if $alliance==="Red"}
    function create_if_block$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Red Alliance";
    			attr_dev(button, "class", "btn btn-outline btn-error w-[260px] h-[75px] mt-3 text-2xl");
    			add_location(button, file$1, 40, 4, 1162);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*updateAlliance*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(40:4) {#if $alliance===\\\"Red\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let p;
    	let img;
    	let img_src_value;
    	let t2;
    	let div3;
    	let input0;
    	let t3;
    	let br0;
    	let t4;
    	let input1;
    	let t5;
    	let br1;
    	let t6;
    	let t7;
    	let br2;
    	let t8;
    	let button;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*$alliance*/ ctx[0] === "Red") return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "AdvantageScout_Scuffed";
    			t1 = space();
    			div1 = element("div");
    			p = element("p");
    			img = element("img");
    			t2 = space();
    			div3 = element("div");
    			input0 = element("input");
    			t3 = space();
    			br0 = element("br");
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			br1 = element("br");
    			t6 = space();
    			if_block.c();
    			t7 = space();
    			br2 = element("br");
    			t8 = space();
    			button = element("button");
    			button.textContent = "Start";
    			attr_dev(div0, "class", "collapse-title font-6xl");
    			add_location(div0, file$1, 24, 4, 529);
    			if (!src_url_equal(img.src, img_src_value = "https://c.tenor.com/bGHiHQn8kwUAAAAM/huh-huhh.gif")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$1, 28, 11, 659);
    			add_location(p, file$1, 28, 8, 656);
    			attr_dev(div1, "class", "collapse-content");
    			add_location(div1, file$1, 27, 4, 616);
    			attr_dev(div2, "tabindex", "0");
    			attr_dev(div2, "class", "collapse border border-base-300 bg-base-100 rounded-box text-6xl font-bold text-secondary");
    			set_style(div2, "font-family", "Roboto,sans-serif");
    			add_location(div2, file$1, 23, 0, 368);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Name");
    			attr_dev(input0, "class", "input input-bordered border-primary w-[260px] h-[50px] text-xl text-primary");
    			add_location(input0, file$1, 34, 4, 800);
    			add_location(br0, file$1, 35, 4, 949);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "Team #");
    			attr_dev(input1, "class", "input input-bordered border-primary w-[260px] h-[50px] mt-3 text-xl text-primary");
    			add_location(input1, file$1, 36, 4, 959);
    			add_location(br1, file$1, 37, 4, 1121);
    			add_location(br2, file$1, 44, 4, 1457);
    			attr_dev(button, "class", "btn btn-outline btn-success w-[260px] h-[75px] mt-3 text-2xl");
    			add_location(button, file$1, 45, 4, 1467);
    			attr_dev(div3, "class", "ml-[385px] mt-[100px] absolute");
    			add_location(div3, file$1, 33, 0, 750);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			append_dev(p, img);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, input0);
    			set_input_value(input0, /*$name*/ ctx[1]);
    			append_dev(div3, t3);
    			append_dev(div3, br0);
    			append_dev(div3, t4);
    			append_dev(div3, input1);
    			set_input_value(input1, /*$teamNumber*/ ctx[2]);
    			append_dev(div3, t5);
    			append_dev(div3, br1);
    			append_dev(div3, t6);
    			if_block.m(div3, null);
    			append_dev(div3, t7);
    			append_dev(div3, br2);
    			append_dev(div3, t8);
    			append_dev(div3, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(button, "click", /*startMatch*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$name*/ 2 && input0.value !== /*$name*/ ctx[1]) {
    				set_input_value(input0, /*$name*/ ctx[1]);
    			}

    			if (dirty & /*$teamNumber*/ 4 && input1.value !== /*$teamNumber*/ ctx[2]) {
    				set_input_value(input1, /*$teamNumber*/ ctx[2]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div3, t7);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div3);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $alliance;
    	let $name;
    	let $teamNumber;
    	validate_store(alliance, 'alliance');
    	component_subscribe($$self, alliance, $$value => $$invalidate(0, $alliance = $$value));
    	validate_store(name, 'name');
    	component_subscribe($$self, name, $$value => $$invalidate(1, $name = $$value));
    	validate_store(teamNumber, 'teamNumber');
    	component_subscribe($$self, teamNumber, $$value => $$invalidate(2, $teamNumber = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('StartPage', slots, []);

    	function updateAlliance() {
    		if ($alliance === "Red") {
    			alliance.update(n => "Blue");
    		} else {
    			alliance.update(n => "Red");
    		}
    	}

    	function startMatch() {
    		matchStage.update(n => n + 1);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<StartPage> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		$name = this.value;
    		name.set($name);
    	}

    	function input1_input_handler() {
    		$teamNumber = this.value;
    		teamNumber.set($teamNumber);
    	}

    	$$self.$capture_state = () => ({
    		matchStage,
    		name,
    		teamNumber,
    		alliance,
    		updateAlliance,
    		startMatch,
    		$alliance,
    		$name,
    		$teamNumber
    	});

    	return [
    		$alliance,
    		$name,
    		$teamNumber,
    		updateAlliance,
    		startMatch,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class StartPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartPage",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var css_248z$1 = ".scroll-lock.svelte-1u63nb1{overflow-x:hidden;overflow-y:hidden}";
    styleInject(css_248z$1);

    /* src\App.svelte generated by Svelte v3.48.0 */
    const file = "src\\App.svelte";

    // (50:4) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Please resize your window to 1024x600 🙂");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(50:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (32:0) {#if properSize}
    function create_if_block(ctx) {
    	let main;
    	let t;
    	let current_block_type_index;
    	let if_block1;
    	let current;
    	let if_block0 = /*matchStageValue*/ ctx[0] > 0 && create_if_block_6(ctx);

    	const if_block_creators = [
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5
    	];

    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*matchStageValue*/ ctx[0] === 1) return 0;
    		if (/*matchStageValue*/ ctx[0] === 2) return 1;
    		if (/*matchStageValue*/ ctx[0] === 3) return 2;
    		if (/*matchStageValue*/ ctx[0] === 4) return 3;
    		if (/*matchStageValue*/ ctx[0] === 0) return 4;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_1(ctx))) {
    		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(main, "class", "svelte-1u63nb1");
    			toggle_class(main, "scroll-lock", true);
    			add_location(main, file, 32, 0, 985);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*matchStageValue*/ ctx[0] > 0) {
    				if (if_block0) {
    					if (dirty & /*matchStageValue*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_6(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block1 = if_blocks[current_block_type_index];

    					if (!if_block1) {
    						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block1.c();
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(main, null);
    				} else {
    					if_block1 = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(32:0) {#if properSize}",
    		ctx
    	});

    	return block;
    }

    // (35:4) {#if matchStageValue>0}
    function create_if_block_6(ctx) {
    	let headerblob;
    	let current;
    	headerblob = new HeaderBlob({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(headerblob.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(headerblob, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(headerblob.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(headerblob.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(headerblob, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(35:4) {#if matchStageValue>0}",
    		ctx
    	});

    	return block;
    }

    // (46:34) 
    function create_if_block_5(ctx) {
    	let startpage;
    	let current;
    	startpage = new StartPage({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(startpage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(startpage, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(startpage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(startpage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(startpage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(46:34) ",
    		ctx
    	});

    	return block;
    }

    // (44:34) 
    function create_if_block_4(ctx) {
    	let qrgenpage;
    	let current;
    	qrgenpage = new QRGenPage({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(qrgenpage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(qrgenpage, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(qrgenpage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(qrgenpage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(qrgenpage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(44:34) ",
    		ctx
    	});

    	return block;
    }

    // (42:30) 
    function create_if_block_3(ctx) {
    	let postscout;
    	let current;
    	postscout = new PostScout({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(postscout.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(postscout, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postscout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postscout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(postscout, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(42:30) ",
    		ctx
    	});

    	return block;
    }

    // (40:30) 
    function create_if_block_2(ctx) {
    	let telescout;
    	let current;
    	telescout = new TeleScout({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(telescout.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(telescout, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(telescout.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(telescout.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(telescout, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(40:30) ",
    		ctx
    	});

    	return block;
    }

    // (38:0) {#if matchStageValue===1}
    function create_if_block_1(ctx) {
    	let automanager;
    	let current;
    	automanager = new AutoManager({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(automanager.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(automanager, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(automanager.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(automanager.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(automanager, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(38:0) {#if matchStageValue===1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*properSize*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let clicksValue;
    	let attentionAlertValue;
    	let matchStageValue;
    	let properSize;

    	const clickSubscription = clicks.subscribe(value => {
    		clicksValue = value;
    	});

    	const matchValueSubscription = matchStage.subscribe(value => {
    		$$invalidate(0, matchStageValue = value);
    	});

    	const attentionAlertSubscription = attentionAlert.subscribe(value => {
    		attentionAlertValue = value;
    	});

    	properSize = window.innerWidth === 1024 && window.innerHeight === 600;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		HeaderBlob,
    		clicks,
    		attentionAlert,
    		AutoManager,
    		matchStage,
    		TeleScout,
    		PostScout,
    		QRGenPage,
    		StartPage,
    		clicksValue,
    		attentionAlertValue,
    		matchStageValue,
    		properSize,
    		clickSubscription,
    		matchValueSubscription,
    		attentionAlertSubscription
    	});

    	$$self.$inject_state = $$props => {
    		if ('clicksValue' in $$props) clicksValue = $$props.clicksValue;
    		if ('attentionAlertValue' in $$props) attentionAlertValue = $$props.attentionAlertValue;
    		if ('matchStageValue' in $$props) $$invalidate(0, matchStageValue = $$props.matchStageValue);
    		if ('properSize' in $$props) $$invalidate(1, properSize = $$props.properSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [matchStageValue, properSize];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var css_248z = "/*\n! tailwindcss v3.1.4 | MIT License | https://tailwindcss.com\n*//*\n1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)\n2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)\n*/\n\n*,\n::before,\n::after {\n  box-sizing: border-box; /* 1 */\n  border-width: 0; /* 2 */\n  border-style: solid; /* 2 */\n  border-color: #e5e7eb; /* 2 */\n}\n\n::before,\n::after {\n  --tw-content: '';\n}\n\n/*\n1. Use a consistent sensible line-height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n3. Use a more readable tab size.\n4. Use the user's configured `sans` font-family by default.\n*/\n\nhtml {\n  line-height: 1.5; /* 1 */\n  -webkit-text-size-adjust: 100%; /* 2 */\n  -moz-tab-size: 4; /* 3 */\n  -o-tab-size: 4;\n     tab-size: 4; /* 3 */\n  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"; /* 4 */\n}\n\n/*\n1. Remove the margin in all browsers.\n2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.\n*/\n\nbody {\n  margin: 0; /* 1 */\n  line-height: inherit; /* 2 */\n}\n\n/*\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n3. Ensure horizontal rules are visible by default.\n*/\n\nhr {\n  height: 0; /* 1 */\n  color: inherit; /* 2 */\n  border-top-width: 1px; /* 3 */\n}\n\n/*\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\n\nabbr:where([title]) {\n  -webkit-text-decoration: underline dotted;\n          text-decoration: underline dotted;\n}\n\n/*\nRemove the default font size and weight for headings.\n*/\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: inherit;\n  font-weight: inherit;\n}\n\n/*\nReset links to optimize for opt-in styling instead of opt-out.\n*/\n\na {\n  color: inherit;\n  text-decoration: inherit;\n}\n\n/*\nAdd the correct font weight in Edge and Safari.\n*/\n\nb,\nstrong {\n  font-weight: bolder;\n}\n\n/*\n1. Use the user's configured `mono` font family by default.\n2. Correct the odd `em` font sizing in all browsers.\n*/\n\ncode,\nkbd,\nsamp,\npre {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; /* 1 */\n  font-size: 1em; /* 2 */\n}\n\n/*\nAdd the correct font size in all browsers.\n*/\n\nsmall {\n  font-size: 80%;\n}\n\n/*\nPrevent `sub` and `sup` elements from affecting the line height in all browsers.\n*/\n\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\nsup {\n  top: -0.5em;\n}\n\n/*\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n3. Remove gaps between table borders by default.\n*/\n\ntable {\n  text-indent: 0; /* 1 */\n  border-color: inherit; /* 2 */\n  border-collapse: collapse; /* 3 */\n}\n\n/*\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n3. Remove default padding in all browsers.\n*/\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  font-family: inherit; /* 1 */\n  font-size: 100%; /* 1 */\n  font-weight: inherit; /* 1 */\n  line-height: inherit; /* 1 */\n  color: inherit; /* 1 */\n  margin: 0; /* 2 */\n  padding: 0; /* 3 */\n}\n\n/*\nRemove the inheritance of text transform in Edge and Firefox.\n*/\n\nbutton,\nselect {\n  text-transform: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Remove default button styles.\n*/\n\nbutton,\n[type='button'],\n[type='reset'],\n[type='submit'] {\n  -webkit-appearance: button; /* 1 */\n  background-color: transparent; /* 2 */\n  background-image: none; /* 2 */\n}\n\n/*\nUse the modern Firefox focus style for all focusable elements.\n*/\n\n:-moz-focusring {\n  outline: auto;\n}\n\n/*\nRemove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)\n*/\n\n:-moz-ui-invalid {\n  box-shadow: none;\n}\n\n/*\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\n\nprogress {\n  vertical-align: baseline;\n}\n\n/*\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\n\n::-webkit-inner-spin-button,\n::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/*\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\n\n[type='search'] {\n  -webkit-appearance: textfield; /* 1 */\n  outline-offset: -2px; /* 2 */\n}\n\n/*\nRemove the inner padding in Chrome and Safari on macOS.\n*/\n\n::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to `inherit` in Safari.\n*/\n\n::-webkit-file-upload-button {\n  -webkit-appearance: button; /* 1 */\n  font: inherit; /* 2 */\n}\n\n/*\nAdd the correct display in Chrome and Safari.\n*/\n\nsummary {\n  display: list-item;\n}\n\n/*\nRemoves the default spacing and border for appropriate elements.\n*/\n\nblockquote,\ndl,\ndd,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nhr,\nfigure,\np,\npre {\n  margin: 0;\n}\n\nfieldset {\n  margin: 0;\n  padding: 0;\n}\n\nlegend {\n  padding: 0;\n}\n\nol,\nul,\nmenu {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n/*\nPrevent resizing textareas horizontally by default.\n*/\n\ntextarea {\n  resize: vertical;\n}\n\n/*\n1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)\n2. Set the default placeholder color to the user's configured gray 400 color.\n*/\n\ninput::-moz-placeholder, textarea::-moz-placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\ninput::placeholder,\ntextarea::placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\n/*\nSet the default cursor for buttons.\n*/\n\nbutton,\n[role=\"button\"] {\n  cursor: pointer;\n}\n\n/*\nMake sure disabled buttons don't get the pointer cursor.\n*/\n:disabled {\n  cursor: default;\n}\n\n/*\n1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)\n2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)\n   This can trigger a poorly considered lint error in some tools but is included by design.\n*/\n\nimg,\nsvg,\nvideo,\ncanvas,\naudio,\niframe,\nembed,\nobject {\n  display: block; /* 1 */\n  vertical-align: middle; /* 2 */\n}\n\n/*\nConstrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)\n*/\n\nimg,\nvideo {\n  max-width: 100%;\n  height: auto;\n}\n\n:root,\n[data-theme] {\n  background-color: hsla(var(--b1) / var(--tw-bg-opacity, 1));\n  color: hsla(var(--bc) / var(--tw-text-opacity, 1));\n}\n\nhtml {\n  -webkit-tap-highlight-color: transparent;\n}\n\n:root {\n  --p: 221 83% 53%;\n  --pf: 221 83% 43%;\n  --sf: 43 96% 45%;\n  --af: 158 64% 42%;\n  --nf: 0 10% 5%;\n  --b2: 0 12% 7%;\n  --b3: 0 12% 7%;\n  --bc: 0 12% 82%;\n  --pc: 221 100% 91%;\n  --sc: 43 100% 11%;\n  --ac: 158 100% 10%;\n  --nc: 0 7% 81%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-btn: 0.5rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --tab-border: 1px;\n  --tab-radius: 0.5rem;\n  --s: 43 96% 56%;\n  --a: 158 64% 52%;\n  --n: 0 10% 6%;\n  --b1: 0 12% 8%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n}\n\n*, ::before, ::after {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\n\n::-webkit-backdrop {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\n\n::backdrop {\n  --tw-border-spacing-x: 0;\n  --tw-border-spacing-y: 0;\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\r\n.avatar.placeholder > div {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\r\n.btn {\n  display: inline-flex;\n  flex-shrink: 0;\n  cursor: pointer;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n       user-select: none;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: center;\n  border-color: transparent;\n  border-color: hsl(var(--n) / var(--tw-border-opacity));\n  text-align: center;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  border-radius: var(--rounded-btn, 0.5rem);\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 1em;\n  min-height: 3rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  text-transform: var(--btn-text-case, uppercase);\n  -webkit-text-decoration-line: none;\n  text-decoration-line: none;\n  border-width: var(--border-btn, 1px);\n  -webkit-animation: button-pop var(--animation-btn, 0.25s) ease-out;\n          animation: button-pop var(--animation-btn, 0.25s) ease-out;\n  --tw-border-opacity: 1;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-disabled, \n  .btn[disabled] {\n  pointer-events: none;\n}\r\n.btn-square {\n  height: 3rem;\n  width: 3rem;\n  padding: 0px;\n}\r\n.btn.loading, \n    .btn.loading:hover {\n  pointer-events: none;\n}\r\n.btn.loading:before {\n  margin-right: 0.5rem;\n  height: 1rem;\n  width: 1rem;\n  border-radius: 9999px;\n  border-width: 2px;\n  -webkit-animation: spin 2s linear infinite;\n          animation: spin 2s linear infinite;\n  content: \"\";\n  border-top-color: transparent;\n  border-left-color: transparent;\n  border-bottom-color: currentColor;\n  border-right-color: currentColor;\n}\r\n@media (prefers-reduced-motion: reduce) {\n\n  .btn.loading:before {\n    -webkit-animation: spin 10s linear infinite;\n            animation: spin 10s linear infinite;\n  }\n}\r\n@-webkit-keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}\r\n@keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}\r\n.btn-group > input[type=\"radio\"].btn {\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n}\r\n.btn-group > input[type=\"radio\"].btn:before {\n  content: attr(data-title);\n}\r\n.checkbox {\n  flex-shrink: 0;\n  --chkbg: var(--bc);\n  --chkfg: var(--b1);\n  height: 1.5rem;\n  width: 1.5rem;\n  cursor: pointer;\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0.2;\n  border-radius: var(--rounded-btn, 0.5rem);\n}\r\n.collapse {\n  position: relative;\n  display: grid;\n  overflow: hidden;\n}\r\n.collapse-title, \n.collapse > input[type=\"checkbox\"], \n.collapse-content {\n  grid-column-start: 1;\n  grid-row-start: 1;\n}\r\n.collapse > input[type=\"checkbox\"] {\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n  opacity: 0;\n}\r\n.collapse-content {\n  grid-row-start: 2;\n  overflow: hidden;\n  max-height: 0px;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  cursor: unset;\n  transition: padding 0.2s ease-in-out, background-color 0.2s ease-in-out;\n}\r\n.collapse-open .collapse-content,\n.collapse:focus:not(.collapse-close) .collapse-content,\n.collapse:not(.collapse-close)\n  input[type=\"checkbox\"]:checked\n  ~ .collapse-content {\n  max-height: 9000px;\n}\r\n:root .countdown {\n  line-height: 1em;\n}\r\n.countdown {\n  display: inline-flex;\n}\r\n.countdown > * {\n  height: 1em;\n  display: inline-block;\n  overflow-y: hidden;\n}\r\n.countdown > *:before {\n  position: relative;\n  content: \"00\\A 01\\A 02\\A 03\\A 04\\A 05\\A 06\\A 07\\A 08\\A 09\\A 10\\A 11\\A 12\\A 13\\A 14\\A 15\\A 16\\A 17\\A 18\\A 19\\A 20\\A 21\\A 22\\A 23\\A 24\\A 25\\A 26\\A 27\\A 28\\A 29\\A 30\\A 31\\A 32\\A 33\\A 34\\A 35\\A 36\\A 37\\A 38\\A 39\\A 40\\A 41\\A 42\\A 43\\A 44\\A 45\\A 46\\A 47\\A 48\\A 49\\A 50\\A 51\\A 52\\A 53\\A 54\\A 55\\A 56\\A 57\\A 58\\A 59\\A 60\\A 61\\A 62\\A 63\\A 64\\A 65\\A 66\\A 67\\A 68\\A 69\\A 70\\A 71\\A 72\\A 73\\A 74\\A 75\\A 76\\A 77\\A 78\\A 79\\A 80\\A 81\\A 82\\A 83\\A 84\\A 85\\A 86\\A 87\\A 88\\A 89\\A 90\\A 91\\A 92\\A 93\\A 94\\A 95\\A 96\\A 97\\A 98\\A 99\\A\";\n  white-space: pre;\n  top: calc(var(--value) * -1em);\n  text-align: center;\n  transition: all 1s cubic-bezier(1, 0, 0, 1);\n}\r\n.label {\n  display: flex;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n       user-select: none;\n  align-items: center;\n  justify-content: space-between;\n  padding-left: 0.25rem;\n  padding-right: 0.25rem;\n  padding-top: 0.5rem;\n  padding-bottom: 0.5rem;\n}\r\n.input {\n  flex-shrink: 1;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 2;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n  border-radius: var(--rounded-btn, 0.5rem);\n}\r\n.input-group > *, \n  .input-group > .input {\n  border-radius: 0px;\n}\r\n.mask {\n  -webkit-mask-size: contain;\n  mask-size: contain;\n  -webkit-mask-repeat: no-repeat;\n  mask-repeat: no-repeat;\n  -webkit-mask-position: center;\n  mask-position: center;\n}\r\n.mask-half-1 {\n  -webkit-mask-size: 200%;\n  mask-size: 200%;\n  -webkit-mask-position: left;\n  mask-position: left;\n}\r\n.mask-half-2 {\n  -webkit-mask-size: 200%;\n  mask-size: 200%;\n  -webkit-mask-position: right;\n  mask-position: right;\n}\r\n.modal {\n  pointer-events: none;\n  visibility: hidden;\n  position: fixed;\n  top: 0px;\n  right: 0px;\n  bottom: 0px;\n  left: 0px;\n  display: flex;\n  justify-content: center;\n  opacity: 0;\n  z-index: 999;\n  background-color: hsl(var(--nf, var(--n)) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.4;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-property: transform, opacity;\n  overflow-y: hidden;\n  overscroll-behavior: contain;\n}\r\n:where(.modal) {\n  align-items: center;\n}\r\n.modal-box {\n  max-height: calc(100vh - 5em);\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n  padding: 1.5rem;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  width: 91.666667%;\n  max-width: 32rem;\n  --tw-scale-x: .9;\n  --tw-scale-y: .9;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  border-top-left-radius: var(--rounded-box, 1rem);\n  border-top-right-radius: var(--rounded-box, 1rem);\n  border-bottom-left-radius: var(--rounded-box, 1rem);\n  border-bottom-right-radius: var(--rounded-box, 1rem);\n  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);\n  overflow-y: auto;\n  overscroll-behavior: contain;\n}\r\n.modal-open, \n.modal:target, \n.modal-toggle:checked + .modal {\n  pointer-events: auto;\n  visibility: visible;\n  opacity: 1;\n}\r\n.modal-toggle {\n  position: fixed;\n  height: 0px;\n  width: 0px;\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n  opacity: 0;\n}\r\n.radio {\n  flex-shrink: 0;\n  --chkbg: var(--bc);\n  height: 1.5rem;\n  width: 1.5rem;\n  cursor: pointer;\n  -webkit-appearance: none;\n     -moz-appearance: none;\n          appearance: none;\n  border-radius: 9999px;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0.2;\n  transition: background, box-shadow var(--animation-input, 0.2s) ease-in-out;\n}\r\n.range {\n  height: 1.5rem;\n  width: 100%;\n  cursor: pointer;\n  -webkit-appearance: none;\n  --range-shdw: var(--bc);\n  overflow: hidden;\n  background-color: transparent;\n  border-radius: var(--rounded-box, 1rem);\n}\r\n.range:focus {\n  outline: none;\n}\r\n.rating {\n  position: relative;\n  display: inline-flex;\n}\r\n.rating :where(input) {\n  cursor: pointer;\n  -webkit-animation: rating-pop var(--animation-input, 0.25s) ease-out;\n          animation: rating-pop var(--animation-input, 0.25s) ease-out;\n  height: 1.5rem;\n  width: 1.5rem;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 1;\n}\r\n.steps .step {\n  display: grid;\n  grid-template-columns: repeat(1, minmax(0, 1fr));\n  grid-template-columns: auto;\n  grid-template-rows: repeat(2, minmax(0, 1fr));\n  grid-template-rows: 40px 1fr;\n  place-items: center;\n  text-align: center;\n  min-width: 4rem;\n}\r\n.textarea {\n  flex-shrink: 1;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  padding-left: 1rem;\n  padding-right: 1rem;\n  padding-top: 0.5rem;\n  padding-bottom: 0.5rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 2;\n  min-height: 3rem;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n  border-radius: var(--rounded-btn, 0.5rem);\n}\r\n.btn-outline .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--s) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--a) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--a) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btn-outline .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  background-color: transparent;\n}\r\n.btn-outline.btn-primary .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--a) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--a) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-info .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--in) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--in) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-success .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--su) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--su) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-warning .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--wa) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--wa) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-error .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--er) / var(--tw-text-opacity));\n}\r\n.btn-outline:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.btn-outline:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sf, var(--s)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--ac) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--ac) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--a) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--ac) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--af, var(--a)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btm-nav>* .label {\n  font-size: 1rem;\n  line-height: 1.5rem;\n}\r\n.btn:active:hover,\n  .btn:active:focus {\n  -webkit-animation: none;\n          animation: none;\n  transform: scale(var(--btn-focus-scale, 0.95));\n}\r\n.btn:hover, \n    .btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--nf, var(--n)) / var(--tw-bg-opacity));\n}\r\n.btn:focus-visible {\n  outline: 2px solid hsl(var(--nf));\n  outline-offset: 2px;\n}\r\n.btn-primary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-primary:hover, \n    .btn-primary.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pf, var(--p)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n}\r\n.btn-primary:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\r\n.btn-secondary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--s) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--s) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-secondary:hover, \n    .btn-secondary.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sf, var(--s)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sf, var(--s)) / var(--tw-bg-opacity));\n}\r\n.btn-secondary:focus-visible {\n  outline: 2px solid hsl(var(--s));\n}\r\n.btn-success {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--su) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--su) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--suc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-success:hover, \n    .btn-success.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--su) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--su) / var(--tw-bg-opacity));\n}\r\n.btn-success:focus-visible {\n  outline: 2px solid hsl(var(--su));\n}\r\n.btn-error {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--er) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--erc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-error:hover, \n    .btn-error.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--er) / var(--tw-bg-opacity));\n}\r\n.btn-error:focus-visible {\n  outline: 2px solid hsl(var(--er));\n}\r\n.btn.glass:hover,\n    .btn.glass.btn-active {\n  --glass-opacity: 25%;\n  --glass-border-opacity: 15%;\n}\r\n.btn.glass:focus-visible {\n  outline: 2px solid 0 0 2px currentColor;\n}\r\n.btn-outline {\n  border-color: currentColor;\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.btn-outline:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--b1) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-primary:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pf, var(--p)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-secondary:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--sf, var(--s)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--sf, var(--s)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--sc) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent {\n  --tw-text-opacity: 1;\n  color: hsl(var(--a) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-accent:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--af, var(--a)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--af, var(--a)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--ac) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-success {\n  --tw-text-opacity: 1;\n  color: hsl(var(--su) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-success:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--su) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--su) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--suc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-info {\n  --tw-text-opacity: 1;\n  color: hsl(var(--in) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-info:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--in) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--in) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--inc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-warning {\n  --tw-text-opacity: 1;\n  color: hsl(var(--wa) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-warning:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--wa) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--wa) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--wac, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-error {\n  --tw-text-opacity: 1;\n  color: hsl(var(--er) / var(--tw-text-opacity));\n}\r\n.btn-outline.btn-error:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--er) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--er) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--erc, var(--nc)) / var(--tw-text-opacity));\n}\r\n.btn-disabled, \n  .btn-disabled:hover, \n  .btn[disabled], \n  .btn[disabled]:hover {\n  --tw-border-opacity: 0;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.2;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.btn.loading.btn-square:before, \n    .btn.loading.btn-circle:before {\n  margin-right: 0px;\n}\r\n.btn.loading.btn-xl:before, \n    .btn.loading.btn-lg:before {\n  height: 1.25rem;\n  width: 1.25rem;\n}\r\n.btn.loading.btn-sm:before, \n    .btn.loading.btn-xs:before {\n  height: 0.75rem;\n  width: 0.75rem;\n}\r\n.btn-group > input[type=\"radio\"]:checked.btn, \n  .btn-group > .btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\r\n.btn-group > input[type=\"radio\"]:checked.btn:focus-visible, .btn-group > .btn-active:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\r\n.btn-group:not(.btn-group-vertical) > .btn:not(:first-of-type) {\n  margin-left: -1px;\n  border-top-left-radius: 0px;\n  border-bottom-left-radius: 0px;\n}\r\n.btn-group:not(.btn-group-vertical) > .btn:not(:last-of-type) {\n  border-top-right-radius: 0px;\n  border-bottom-right-radius: 0px;\n}\r\n.btn-group-vertical > .btn:not(:first-of-type) {\n  margin-top: -1px;\n  border-top-left-radius: 0px;\n  border-top-right-radius: 0px;\n}\r\n.btn-group-vertical > .btn:not(:last-of-type) {\n  border-bottom-right-radius: 0px;\n  border-bottom-left-radius: 0px;\n}\r\n@-webkit-keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}\r\n@keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}\r\n.checkbox:focus-visible {\n  outline: 2px solid hsl(var(--bc));\n  outline-offset: 2px;\n}\r\n.checkbox:checked, \n  .checkbox[checked=\"true\"] {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  background-repeat: no-repeat;\n  -webkit-animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n          animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n  background-image: linear-gradient(-45deg, transparent 65%, hsl(var(--chkbg)) 65.99%), linear-gradient(45deg, transparent 75%, hsl(var(--chkbg)) 75.99%), linear-gradient(-45deg, hsl(var(--chkbg)) 40%, transparent 40.99%), linear-gradient(45deg, hsl(var(--chkbg)) 30%, hsl(var(--chkfg)) 30.99%, hsl(var(--chkfg)) 40%, transparent 40.99%), linear-gradient(-45deg, hsl(var(--chkfg)) 50%, hsl(var(--chkbg)) 50.99%);\n}\r\n.checkbox:indeterminate {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  background-repeat: no-repeat;\n  -webkit-animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n          animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n  background-image: linear-gradient(90deg, transparent 80%, hsl(var(--chkbg)) 80%), linear-gradient(-90deg, transparent 80%, hsl(var(--chkbg)) 80%), linear-gradient(0deg, hsl(var(--chkbg)) 43%, hsl(var(--chkfg)) 43%, hsl(var(--chkfg)) 57%, hsl(var(--chkbg)) 57%);\n}\r\n.checkbox:disabled {\n  cursor: not-allowed;\n  border-color: transparent;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  opacity: 0.2;\n}\r\n@-webkit-keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}\r\n@keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}\r\nbody[dir=\"rtl\"] .checkbox {\n  --chkbg: var(--bc);\n  --chkfg: var(--b1);\n}\r\nbody[dir=\"rtl\"] .checkbox:checked,\n    body[dir=\"rtl\"] .checkbox[checked=\"true\"] {\n  background-image: linear-gradient(45deg, transparent 65%, hsl(var(--chkbg)) 65.99%), linear-gradient(-45deg, transparent 75%, hsl(var(--chkbg)) 75.99%), linear-gradient(45deg, hsl(var(--chkbg)) 40%, transparent 40.99%), linear-gradient(-45deg, hsl(var(--chkbg)) 30%, hsl(var(--chkfg)) 30.99%, hsl(var(--chkfg)) 40%, transparent 40.99%), linear-gradient(45deg, hsl(var(--chkfg)) 50%, hsl(var(--chkbg)) 50.99%);\n}\r\n.collapse:focus-visible {\n  outline: 2px solid hsl(var(--nf));\n  outline-offset: 2px;\n}\r\n.collapse-arrow .collapse-title:after {\n  position: absolute;\n  display: block;\n  height: 0.5rem;\n  width: 0.5rem;\n  transition-property: all;\n  transition-duration: 150ms;\n  transition-duration: 0.2s;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  top: 1.4rem;\n  right: 1.4rem;\n  content: \"\";\n  transform-origin: 75% 75%;\n  transform: rotate(45deg);\n  box-shadow: 2px 2px;\n  pointer-events: none;\n}\r\n.collapse-plus .collapse-title:after {\n  position: absolute;\n  display: block;\n  height: 0.5rem;\n  width: 0.5rem;\n  transition-property: all;\n  transition-duration: 300ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  top: 0.9rem;\n  right: 1.4rem;\n  content: \"+\";\n  pointer-events: none;\n}\r\n.collapse:not(.collapse-open):not(.collapse-close) input[type=\"checkbox\"], \n.collapse:not(.collapse-open):not(.collapse-close) .collapse-title {\n  cursor: pointer;\n}\r\n.collapse:focus:not(.collapse-open):not(.collapse-close) .collapse-title {\n  cursor: unset;\n}\r\n.collapse-title, \n.collapse > input[type=\"checkbox\"] {\n  width: 100%;\n  padding: 1rem;\n  padding-right: 3rem;\n  min-height: 3.75rem;\n  transition: background-color 0.2s ease-in-out;\n}\r\n.collapse-open :where(.collapse-content), \n.collapse:focus:not(.collapse-close) :where(.collapse-content), \n.collapse:not(.collapse-close) :where(input[type=\"checkbox\"]:checked ~ .collapse-content) {\n  padding-bottom: 1rem;\n  transition: padding 0.2s ease-in-out, background-color 0.2s ease-in-out;\n}\r\n.collapse-open.collapse-arrow .collapse-title:after,\n.collapse-arrow:focus:not(.collapse-close) .collapse-title:after,\n.collapse-arrow:not(.collapse-close) input[type=\"checkbox\"]:checked ~ .collapse-title:after {\n  transform: rotate(225deg);\n}\r\n.collapse-open.collapse-plus .collapse-title:after,\n.collapse-plus:focus:not(.collapse-close) .collapse-title:after,\n.collapse-plus:not(.collapse-close) input[type=\"checkbox\"]:checked ~ .collapse-title:after {\n  content: \"−\";\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-primary {\n  outline: 2px solid hsl(var(--p));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-secondary {\n  outline: 2px solid hsl(var(--s));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-success {\n  outline: 2px solid hsl(var(--su));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-error {\n  outline: 2px solid hsl(var(--er));\n}\r\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.glass {\n  outline: 2px solid currentColor;\n}\r\n.label a:hover {\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.input[list]::-webkit-calendar-picker-indicator {\n  line-height: 1em;\n}\r\n.input-bordered {\n  --tw-border-opacity: 0.2;\n}\r\n.input:focus {\n  outline: 2px solid hsla(var(--bc) / 0.2);\n  outline-offset: 2px;\n}\r\n.input-disabled, \n  .input[disabled] {\n  cursor: not-allowed;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.input-disabled::-moz-placeholder, .input[disabled]::-moz-placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n.input-disabled::placeholder, \n  .input[disabled]::placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n.mask-star-2 {\n  -webkit-mask-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTkycHgiIGhlaWdodD0iMTgwcHgiIHZpZXdCb3g9IjAgMCAxOTIgMTgwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA2MC4xICg4ODEzMykgLSBodHRwczovL3NrZXRjaC5jb20gLS0+CiAgICA8dGl0bGU+c3Rhci0yPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPHBvbHlnb24gaWQ9InN0YXItMiIgZmlsbD0iIzAwMDAwMCIgcG9pbnRzPSI5NiAxNTMuMDQzNjYxIDM3LjIyMTQ3NDggMTc5LjI4NjUwNiA0NC4yNDExOTA0IDExNS43NzQ0NDQgMC44OTQzNDgzNyA2OC40ODEzNTE1IDY0LjAxMTI5NjUgNTUuNDcxNTgyOCA5NiAwIDEyNy45ODg3MDQgNTUuNDcxNTgyOCAxOTEuMTA1NjUyIDY4LjQ4MTM1MTUgMTQ3Ljc1ODgxIDExNS43NzQ0NDQgMTU0Ljc3ODUyNSAxNzkuMjg2NTA2Ij48L3BvbHlnb24+CiAgICA8L2c+Cjwvc3ZnPg==);\n  mask-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iMTkycHgiIGhlaWdodD0iMTgwcHgiIHZpZXdCb3g9IjAgMCAxOTIgMTgwIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA2MC4xICg4ODEzMykgLSBodHRwczovL3NrZXRjaC5jb20gLS0+CiAgICA8dGl0bGU+c3Rhci0yPC90aXRsZT4KICAgIDxkZXNjPkNyZWF0ZWQgd2l0aCBTa2V0Y2guPC9kZXNjPgogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPHBvbHlnb24gaWQ9InN0YXItMiIgZmlsbD0iIzAwMDAwMCIgcG9pbnRzPSI5NiAxNTMuMDQzNjYxIDM3LjIyMTQ3NDggMTc5LjI4NjUwNiA0NC4yNDExOTA0IDExNS43NzQ0NDQgMC44OTQzNDgzNyA2OC40ODEzNTE1IDY0LjAxMTI5NjUgNTUuNDcxNTgyOCA5NiAwIDEyNy45ODg3MDQgNTUuNDcxNTgyOCAxOTEuMTA1NjUyIDY4LjQ4MTM1MTUgMTQ3Ljc1ODgxIDExNS43NzQ0NDQgMTU0Ljc3ODUyNSAxNzkuMjg2NTA2Ij48L3BvbHlnb24+CiAgICA8L2c+Cjwvc3ZnPg==);\n}\r\n.modal-open .modal-box, \n.modal-toggle:checked + .modal .modal-box, \n.modal:target .modal-box {\n  --tw-translate-y: 0px;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n@-webkit-keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}\r\n@keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}\r\n.radio:focus-visible {\n  outline: 2px solid hsl(var(--bc));\n  outline-offset: 2px;\n}\r\n.radio:checked {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  -webkit-animation: radiomark var(--animation-input, 0.2s) ease-in-out;\n          animation: radiomark var(--animation-input, 0.2s) ease-in-out;\n  box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n}\r\n.radio:disabled {\n  cursor: not-allowed;\n  opacity: 0.2;\n}\r\n@-webkit-keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}\r\n@keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}\r\n.range:focus-visible::-webkit-slider-thumb {\n  --focus-shadow: 0 0 0 6px hsl(var(--b1)) inset, 0 0 0 2rem hsl(var(--range-shdw)) inset;\n}\r\n.range:focus-visible::-moz-range-thumb {\n  --focus-shadow: 0 0 0 6px hsl(var(--b1)) inset, 0 0 0 2rem hsl(var(--range-shdw)) inset;\n}\r\n.range::-webkit-slider-runnable-track {\n  height: 0.5rem;\n  width: 100%;\n  border-radius: var(--rounded-box, 1rem);\n  background-color: hsla(var(--bc) / 0.1);\n}\r\n.range::-moz-range-track {\n  height: 0.5rem;\n  width: 100%;\n  border-radius: var(--rounded-box, 1rem);\n  background-color: hsla(var(--bc) / 0.1);\n}\r\n.range::-webkit-slider-thumb {\n  background-color: hsl(var(--b1));\n  position: relative;\n  height: 1.5rem;\n  width: 1.5rem;\n  border-style: none;\n  border-radius: var(--rounded-box, 1rem);\n  -webkit-appearance: none;\n  top: 50%;\n  color: hsl(var(--range-shdw));\n  transform: translateY(-50%);\n  --filler-size: 100rem;\n  --filler-offset: 0.6rem;\n  box-shadow: 0 0 0 3px hsl(var(--range-shdw)) inset, var(--focus-shadow, 0 0), calc(var(--filler-size) * -1 - var(--filler-offset)) 0 0 var(--filler-size);\n}\r\n.range::-moz-range-thumb {\n  background-color: hsl(var(--b1));\n  position: relative;\n  height: 1.5rem;\n  width: 1.5rem;\n  border-style: none;\n  border-radius: var(--rounded-box, 1rem);\n  top: 50%;\n  color: hsl(var(--range-shdw));\n  --filler-size: 100rem;\n  --filler-offset: 0.5rem;\n  box-shadow: 0 0 0 3px hsl(var(--range-shdw)) inset, var(--focus-shadow, 0 0), calc(var(--filler-size) * -1 - var(--filler-offset)) 0 0 var(--filler-size);\n}\r\n.range-secondary {\n  --range-shdw: var(--s);\n}\r\n.range-accent {\n  --range-shdw: var(--a);\n}\r\n.rating input {\n  -moz-appearance: none;\n       appearance: none;\n  -webkit-appearance: none;\n}\r\n.rating .rating-hidden {\n  width: 0.5rem;\n  background-color: transparent;\n}\r\n.rating input:checked ~ input {\n  --tw-bg-opacity: 0.2;\n}\r\n.rating input:focus-visible {\n  transition-property: transform;\n  transition-duration: 300ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transform: translateY(-0.125em);\n}\r\n.rating input:active:focus {\n  -webkit-animation: none;\n          animation: none;\n  transform: translateY(-0.125em);\n}\r\n.rating-half :where(input:not(.rating-hidden)) {\n  width: 0.75rem;\n}\r\n@-webkit-keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}\r\n@keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}\r\n.steps .step:before {\n  top: 0px;\n  grid-column-start: 1;\n  grid-row-start: 1;\n  height: 0.5rem;\n  width: 100%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b3, var(--b2)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  content: \"\";\n  margin-left: -100%;\n}\r\n.steps .step:after {\n  content: counter(step);\n  counter-increment: step;\n  z-index: 1;\n  position: relative;\n  grid-column-start: 1;\n  grid-row-start: 1;\n  display: grid;\n  height: 2rem;\n  width: 2rem;\n  place-items: center;\n  place-self: center;\n  border-radius: 9999px;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b3, var(--b2)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\r\n.steps .step:first-child:before {\n  content: none;\n}\r\n.steps .step[data-content]:after {\n  content: attr(data-content);\n}\r\n.textarea:focus {\n  outline: 2px solid hsla(var(--bc) / 0.2);\n  outline-offset: 2px;\n}\r\n.textarea-primary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n}\r\n.textarea-primary:focus {\n  outline: 2px solid hsl(var(--p));\n}\r\n.textarea-disabled, \n  .textarea[disabled] {\n  cursor: not-allowed;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 0.2;\n}\r\n.textarea-disabled::-moz-placeholder, .textarea[disabled]::-moz-placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n.textarea-disabled::placeholder, \n  .textarea[disabled]::placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\r\n.rounded-box {\n  border-radius: var(--rounded-box, 1rem);\n}\r\n.glass,\n  .glass:hover,\n  .glass.btn-active {\n  border: none;\n  -webkit-backdrop-filter: blur(var(--glass-blur, 40px));\n  backdrop-filter: blur(var(--glass-blur, 40px));\n  background-color: transparent;\n  background-image: linear-gradient(\n        135deg,\n        rgb(255 255 255 / var(--glass-opacity, 30%)) 0%,\n        rgb(0 0 0 / 0%) 100%\n      ),\n      linear-gradient(\n        var(--glass-reflex-degree, 100deg),\n        rgb(255 255 255 / var(--glass-reflex-opacity, 10%)) 25%,\n        rgb(0 0 0 / 0%) 25%\n      );\n  box-shadow: 0 0 0 1px rgb(255 255 255 / var(--glass-border-opacity, 10%))\n        inset,\n      0 0 0 2px rgb(0 0 0 / 5%);\n  text-shadow: 0 1px rgb(0 0 0 / var(--glass-text-shadow-opacity, 5%));\n}\r\n.btn-square:where(.btn-xs) {\n  height: 1.5rem;\n  width: 1.5rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-sm) {\n  height: 2rem;\n  width: 2rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-md) {\n  height: 3rem;\n  width: 3rem;\n  padding: 0px;\n}\r\n.btn-square:where(.btn-lg) {\n  height: 4rem;\n  width: 4rem;\n  padding: 0px;\n}\r\n.range-lg {\n  height: 2rem;\n}\r\n.range-lg::-webkit-slider-runnable-track {\n  height: 1rem;\n}\r\n.range-lg::-moz-range-track {\n  height: 1rem;\n}\r\n.range-lg::-webkit-slider-thumb {\n  height: 2rem;\n  width: 2rem;\n  --filler-offset: 1rem;\n}\r\n.range-lg::-moz-range-thumb {\n  height: 2rem;\n  width: 2rem;\n  --filler-offset: 1rem;\n}\r\n.rating-lg input {\n  height: 2.5rem;\n  width: 2.5rem;\n}\r\n.rating-half.rating-xs input:not(.rating-hidden) {\n  width: 0.375rem;\n}\r\n.rating-half.rating-sm input:not(.rating-hidden) {\n  width: 0.5rem;\n}\r\n.rating-half.rating-md input:not(.rating-hidden) {\n  width: 0.75rem;\n}\r\n.rating-half.rating-lg input:not(.rating-hidden) {\n  width: 1.25rem;\n}\r\n.steps-horizontal .step {\n  display: grid;\n  grid-template-columns: repeat(1, minmax(0, 1fr));\n  grid-template-rows: repeat(2, minmax(0, 1fr));\n  place-items: center;\n  text-align: center;\n}\r\n.steps-vertical .step {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  grid-template-rows: repeat(1, minmax(0, 1fr));\n}\r\n.modal-bottom :where(.modal-box) {\n  width: 100%;\n  max-width: none;\n  --tw-translate-y: 2.5rem;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  border-bottom-right-radius: 0px;\n  border-bottom-left-radius: 0px;\n}\r\n.modal-middle :where(.modal-box) {\n  width: 91.666667%;\n  max-width: 32rem;\n  --tw-translate-y: 0px;\n  --tw-scale-x: .9;\n  --tw-scale-y: .9;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  border-bottom-left-radius: var(--rounded-box, 1rem);\n  border-bottom-right-radius: var(--rounded-box, 1rem);\n}\r\n.steps-horizontal .step {\n  grid-template-rows: 40px 1fr;\n  grid-template-columns: auto;\n  min-width: 4rem;\n}\r\n.steps-horizontal .step:before {\n  height: 0.5rem;\n  width: 100%;\n  --tw-translate-y: 0px;\n  --tw-translate-x: 0px;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  content: \"\";\n  margin-left: -100%;\n}\r\n.steps-vertical .step {\n  gap: 0.5rem;\n  grid-template-columns: 40px 1fr;\n  grid-template-rows: auto;\n  min-height: 4rem;\n  justify-items: start;\n}\r\n.steps-vertical .step:before {\n  height: 100%;\n  width: 0.5rem;\n  --tw-translate-y: -50%;\n  --tw-translate-x: -50%;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  margin-left: 50%;\n}\r\n.fixed {\n  position: fixed;\n}\r\n.absolute {\n  position: absolute;\n}\r\n.relative {\n  position: relative;\n}\r\n.z-30 {\n  z-index: 30;\n}\r\n.z-10 {\n  z-index: 10;\n}\r\n.z-20 {\n  z-index: 20;\n}\r\n.z-40 {\n  z-index: 40;\n}\r\n.col-span-1 {\n  grid-column: span 1 / span 1;\n}\r\n.col-start-1 {\n  grid-column-start: 1;\n}\r\n.col-start-2 {\n  grid-column-start: 2;\n}\r\n.col-start-3 {\n  grid-column-start: 3;\n}\r\n.row-span-1 {\n  grid-row: span 1 / span 1;\n}\r\n.row-span-3 {\n  grid-row: span 3 / span 3;\n}\r\n.row-start-1 {\n  grid-row-start: 1;\n}\r\n.row-start-2 {\n  grid-row-start: 2;\n}\r\n.row-start-3 {\n  grid-row-start: 3;\n}\r\n.row-end-2 {\n  grid-row-end: 2;\n}\r\n.float-right {\n  float: right;\n}\r\n.mt-36 {\n  margin-top: 9rem;\n}\r\n.ml-36 {\n  margin-left: 9rem;\n}\r\n.mr-24 {\n  margin-right: 6rem;\n}\r\n.mt-1 {\n  margin-top: 0.25rem;\n}\r\n.ml-9 {\n  margin-left: 2.25rem;\n}\r\n.mt-4 {\n  margin-top: 1rem;\n}\r\n.ml-11 {\n  margin-left: 2.75rem;\n}\r\n.mt-3 {\n  margin-top: 0.75rem;\n}\r\n.-mt-5 {\n  margin-top: -1.25rem;\n}\r\n.ml-6 {\n  margin-left: 1.5rem;\n}\r\n.mt-20 {\n  margin-top: 5rem;\n}\r\n.-ml-3 {\n  margin-left: -0.75rem;\n}\r\n.ml-8 {\n  margin-left: 2rem;\n}\r\n.-mt-\\[10px\\] {\n  margin-top: -10px;\n}\r\n.-mt-9 {\n  margin-top: -2.25rem;\n}\r\n.mt-6 {\n  margin-top: 1.5rem;\n}\r\n.mt-24 {\n  margin-top: 6rem;\n}\r\n.-ml-20 {\n  margin-left: -5rem;\n}\r\n.-mt-2 {\n  margin-top: -0.5rem;\n}\r\n.-ml-1 {\n  margin-left: -0.25rem;\n}\r\n.ml-32 {\n  margin-left: 8rem;\n}\r\n.mt-7 {\n  margin-top: 1.75rem;\n}\r\n.ml-\\[10px\\] {\n  margin-left: 10px;\n}\r\n.mt-9 {\n  margin-top: 2.25rem;\n}\r\n.ml-10 {\n  margin-left: 2.5rem;\n}\r\n.ml-\\[350px\\] {\n  margin-left: 350px;\n}\r\n.ml-\\[700px\\] {\n  margin-left: 700px;\n}\r\n.-mt-1 {\n  margin-top: -0.25rem;\n}\r\n.ml-1 {\n  margin-left: 0.25rem;\n}\r\n.mt-\\[160px\\] {\n  margin-top: 160px;\n}\r\n.mt-\\[150px\\] {\n  margin-top: 150px;\n}\r\n.ml-5 {\n  margin-left: 1.25rem;\n}\r\n.mt-72 {\n  margin-top: 18rem;\n}\r\n.ml-\\[750px\\] {\n  margin-left: 750px;\n}\r\n.ml-16 {\n  margin-left: 4rem;\n}\r\n.mt-60 {\n  margin-top: 15rem;\n}\r\n.ml-40 {\n  margin-left: 10rem;\n}\r\n.ml-\\[382px\\] {\n  margin-left: 382px;\n}\r\n.mt-\\[27px\\] {\n  margin-top: 27px;\n}\r\n.ml-72 {\n  margin-left: 18rem;\n}\r\n.ml-\\[312px\\] {\n  margin-left: 312px;\n}\r\n.ml-\\[292px\\] {\n  margin-left: 292px;\n}\r\n.mt-\\[60px\\] {\n  margin-top: 60px;\n}\r\n.mt-\\[30px\\] {\n  margin-top: 30px;\n}\r\n.mt-\\[400px\\] {\n  margin-top: 400px;\n}\r\n.mt-\\[330px\\] {\n  margin-top: 330px;\n}\r\n.ml-\\[720px\\] {\n  margin-left: 720px;\n}\r\n.ml-\\[775px\\] {\n  margin-left: 775px;\n}\r\n.ml-\\[300px\\] {\n  margin-left: 300px;\n}\r\n.mt-\\[200px\\] {\n  margin-top: 200px;\n}\r\n.mt-5 {\n  margin-top: 1.25rem;\n}\r\n.mt-\\[100px\\] {\n  margin-top: 100px;\n}\r\n.ml-\\[380px\\] {\n  margin-left: 380px;\n}\r\n.ml-\\[385px\\] {\n  margin-left: 385px;\n}\r\n.flex {\n  display: flex;\n}\r\n.grid {\n  display: grid;\n}\r\n.hidden {\n  display: none;\n}\r\n.h-48 {\n  height: 12rem;\n}\r\n.h-12 {\n  height: 3rem;\n}\r\n.h-full {\n  height: 100%;\n}\r\n.h-2\\/5 {\n  height: 40%;\n}\r\n.h-24 {\n  height: 6rem;\n}\r\n.h-20 {\n  height: 5rem;\n}\r\n.h-14 {\n  height: 3.5rem;\n}\r\n.h-\\[50px\\] {\n  height: 50px;\n}\r\n.h-\\[90px\\] {\n  height: 90px;\n}\r\n.h-\\[200px\\] {\n  height: 200px;\n}\r\n.h-36 {\n  height: 9rem;\n}\r\n.h-\\[100px\\] {\n  height: 100px;\n}\r\n.h-fit {\n  height: -webkit-fit-content;\n  height: -moz-fit-content;\n  height: fit-content;\n}\r\n.h-\\[75px\\] {\n  height: 75px;\n}\r\n.w-72 {\n  width: 18rem;\n}\r\n.w-12 {\n  width: 3rem;\n}\r\n.w-full {\n  width: 100%;\n}\r\n.w-2\\/5 {\n  width: 40%;\n}\r\n.w-36 {\n  width: 9rem;\n}\r\n.w-24 {\n  width: 6rem;\n}\r\n.w-2\\/6 {\n  width: 33.333333%;\n}\r\n.w-1\\/6 {\n  width: 16.666667%;\n}\r\n.w-\\[665px\\] {\n  width: 665px;\n}\r\n.w-\\[200px\\] {\n  width: 200px;\n}\r\n.w-96 {\n  width: 24rem;\n}\r\n.w-fit {\n  width: -webkit-fit-content;\n  width: -moz-fit-content;\n  width: fit-content;\n}\r\n.w-11\\/12 {\n  width: 91.666667%;\n}\r\n.w-\\[100px\\] {\n  width: 100px;\n}\r\n.w-\\[300px\\] {\n  width: 300px;\n}\r\n.w-\\[260px\\] {\n  width: 260px;\n}\r\n.max-w-xs {\n  max-width: 20rem;\n}\r\n.-rotate-90 {\n  --tw-rotate: -90deg;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\r\n.cursor-pointer {\n  cursor: pointer;\n}\r\n.resize {\n  resize: both;\n}\r\n.grid-cols-2 {\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n}\r\n.grid-cols-1 {\n  grid-template-columns: repeat(1, minmax(0, 1fr));\n}\r\n.grid-cols-3 {\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n}\r\n.grid-rows-1 {\n  grid-template-rows: repeat(1, minmax(0, 1fr));\n}\r\n.grid-rows-2 {\n  grid-template-rows: repeat(2, minmax(0, 1fr));\n}\r\n.grid-rows-3 {\n  grid-template-rows: repeat(3, minmax(0, 1fr));\n}\r\n.content-center {\n  align-content: center;\n}\r\n.items-start {\n  align-items: flex-start;\n}\r\n.gap-2 {\n  gap: 0.5rem;\n}\r\n.gap-x-1 {\n  -moz-column-gap: 0.25rem;\n       column-gap: 0.25rem;\n}\r\n.overflow-auto {\n  overflow: auto;\n}\r\n.overflow-hidden {\n  overflow: hidden;\n}\r\n.overflow-visible {\n  overflow: visible;\n}\r\n.border {\n  border-width: 1px;\n}\r\n.border-base-300 {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b3, var(--b2)) / var(--tw-border-opacity));\n}\r\n.border-primary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n}\r\n.bg-amber-500 {\n  --tw-bg-opacity: 1;\n  background-color: rgb(245 158 11 / var(--tw-bg-opacity));\n}\r\n.bg-base-100 {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n}\r\n.py-4 {\n  padding-top: 1rem;\n  padding-bottom: 1rem;\n}\r\n.font-mono {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;\n}\r\n.text-2xl {\n  font-size: 1.5rem;\n  line-height: 2rem;\n}\r\n.text-5xl {\n  font-size: 3rem;\n  line-height: 1;\n}\r\n.text-6xl {\n  font-size: 3.75rem;\n  line-height: 1;\n}\r\n.text-lg {\n  font-size: 1.125rem;\n  line-height: 1.75rem;\n}\r\n.text-xl {\n  font-size: 1.25rem;\n  line-height: 1.75rem;\n}\r\n.text-3xl {\n  font-size: 1.875rem;\n  line-height: 2.25rem;\n}\r\n.text-7xl {\n  font-size: 4.5rem;\n  line-height: 1;\n}\r\n.font-bold {\n  font-weight: 700;\n}\r\n.font-medium {\n  font-weight: 500;\n}\r\n.leading-\\[40px\\] {\n  line-height: 40px;\n}\r\n.leading-\\[90px\\] {\n  line-height: 90px;\n}\r\n.text-secondary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--s) / var(--tw-text-opacity));\n}\r\n.text-primary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\r\n\r\n";
    styleInject(css_248z);

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
