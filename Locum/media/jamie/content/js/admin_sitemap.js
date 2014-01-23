

/*
Class: Sitemap
*/

var Sitemap = new Class({

	options: {
		onStart: Class.empty,
		onComplete: Class.empty,
		snap: 3,
		scrollContainers: null
	},

	initialize: function(list, options){
        this.setOptions(options);
		this.list = $(list);
		this.elements = this.list.getChildren();
		
		this.elements.each(function(el) {
			el.node_id = parseInt($E('input.node_id', el).value);
			el.depth = parseInt($E('input.depth', el).value);
			el.anchored = ($E('div.anchored img', el) != null);
		});

 		this.scroller = new Scroller(this.list.getParent(), {area: 50, velocity: 0.5});

		this.handles = this.elements.map(function(el, index){
			return $E('span.title', el);
		});
		this.bound = {
			'start': []
		};
		for (var i = 0, l = this.handles.length; i < l; i++){
			this.bound.start[i] = this.start.bindWithEvent(this, this.elements[i]);
		}
		this.attach();
		if (this.options.initialize) this.options.initialize.call(this);
		this.bound.expand = this.expand.bind(this);
		this.bound.startDrag = this.startDrag.bind(this);
		this.bound.move = this.move.bindWithEvent(this);
		this.bound.end = this.end.bind(this);
		this.zebraStripeRows();
	},

	attach: function(){
		this.handles.each(function(handle, i){
			if(this.bound.start[i])
				handle.addEvent('mousedown', this.bound.start[i]);
		}, this);
	},

	detach: function(){
		this.handles.each(function(handle, i){
			if(this.bound.start[i])
				handle.removeEvent('mousedown', this.bound.start[i]);
		}, this);
	},

	expand: function(event, el, forceCollapse){
		var source = el;
		if(source.hasClass('collapsed') && !forceCollapse) {
			var action = function(el, depth) {
				if(el.depth == depth) {
					if(el.hasClass('expanded')) {
						el.removeClass('expanded');
						el.addClass('collapsed');
					}
					el.removeClass('hiddenNode');
				} else {
					el.addClass('hiddenNode');
				}
			};
			source.removeClass('collapsed');
			source.addClass('expanded');
		} else if(source.hasClass('expanded') || forceCollapse) {
			var action = function(el, depth) {
				el.addClass('hiddenNode');
			};
			if(source.hasClass('expanded')) {
				source.addClass('collapsed');
				source.removeClass('expanded');
			}
		} else {
			return;
		}

		var next = source.getNext();
		while(next && next.depth > source.depth) {
			action(next, source.depth + 1)
			next = next.getNext();
		}
		this.zebraStripeRows();
	},

	endBadDrag: function(event, el) {
		document.removeListener('mouseup', this.bound.endBadDrag);
		$$(document.body).removeClass("sitemap_nodrag");
	},

	start: function(event, el) {
		event = new Event(event);
		var initDrag = function(el, clearEvents) {
			el.removeEvents('mousemove');
			el.removeEvents('mouseup');
			// Workaround for mootools bug
			el.$events['mousemove'] = {'keys': [], 'values': []}
			el.$events['mouseup'] = {'keys': [], 'values': []}
			
			if(el.hasClass('hiddenNode')) {
				$$(document.body).addClass("sitemap_nodrag");
				this.bound.endBadDrag = this.endBadDrag.bindWithEvent(this, el);
				document.addListener('mouseup', this.bound.endBadDrag);
			} else {
				this.bound.startDrag(event, el);
			}
		};

		var timeout = window.setTimeout(initDrag.bind(this, el), 400);
		var moveStartsDrag = function(el) {
			window.clearTimeout(timeout);
			initDrag.bind(this)(el);
		};
		var ignoreDrag = function(el, clearEvents) {
			el.removeEvents('mousemove');
			el.removeEvents('mouseup');
			// Workaround for mootools bug
			el.$events['mousemove'] = {'keys': [], 'values': []}
			el.$events['mouseup'] = {'keys': [], 'values': []}

			window.clearTimeout(timeout);
			this.bound.expand(event, el);
		};

		el.addEvent('mousemove', moveStartsDrag.bind(this, el));
		el.addEvent('mouseup', ignoreDrag.bind(this, el));
		event.stop();
	},

	startDrag: function(event, el){
		this.source = el;
		$$(document.body).addClass("sitemap_move");
		this.expand(null, this.source, true);
		this.oldParent = this.source.getPrevious();
		this.sources = [this.source];
		var next = this.source.getNext();
		while(next && next.depth > this.source.depth) {
			this.sources.push(next);
			next = next.getNext();
		}
		this.sources.each(function(el) {
			el.title_element = $E('span.title', el);
		});

		this.target = new Element('li').addClass('target');
		this.target.depth = this.source.depth;
		this.marker = new Element('div').addClass('marker').setStyle('display', 'none').injectAfter(this.list);
		var commonPadding = parseInt(this.source.title_element.getStyle('padding-left'));
		var cloneList = new Element('ul').inject(this.target);
		this.sources.each(function(el) {
			var clone = el.clone();
			clone.getElements('span.title').each(function(el2){
				el2.original_padding = parseInt(el.title_element.getStyle('padding-left')) - commonPadding;
			});
			clone.inject(cloneList);
		});
		this.target.injectBefore(this.source);
		this.sources.each(function(el) {
			el.remove();
		});
		this.xOffset = event.page.x;
		this.coordinates = this.list.getCoordinates(this.options.scrollContainers);
		document.addListener('mousemove', this.bound.move);
		document.addListener('mouseup', this.bound.end);

		this.scroller.start()

		this.fireEvent('onStart', el);
		this.move(event);
	},

	move: function(event){
		event = new Event(event);

		// Find the candidate location to drop at.
		var currentY = event.page.y;
		var dropAfter = null;
		var coords = this.target.getCoordinates(this.options.scrollContainers);
		if(currentY < coords.top) {
			dropAfter = this.target;
			var node = this.target;
			while(true) {
				coords = node && node.getCoordinates(this.options.scrollContainers);
				if(node && coords.bottom > currentY) {
					if(!node.hasClass('hiddenNode'))
						dropAfter = node;
				} else {
					break;
				}
				node = node.getPrevious();
			}
			dropAfter = dropAfter.getPrevious();
		} else if(currentY >= coords.bottom) {
			var node = this.target.getNext();
			while(true) {
				coords = node && node.getCoordinates(this.options.scrollContainers);
				if(node && coords.top <= currentY) {
					if(!node.getNext() || !node.getNext().hasClass('hiddenNode'))
						dropAfter = node;
				} else {
					break;
				}
				node = node.getNext();
			}
			if(!dropAfter)
				dropAfter = this.target.getPrevious();
		} else {
			dropAfter = this.target.getPrevious();
		}
		// We want to insert after node, or at the top of the list
		
		// Find the candidate depth to drop at
		var dropDepth = 0;
		var minDepth = 0;
		var maxDepth = 0;
		if(dropAfter) {
			var prev = dropAfter;
			while(prev && prev.hasClass('hiddenNode'))
				prev = prev.getPrevious();
			var next = dropAfter.getNext();
			while(next == this.target)
				next = next.getNext();
			var prev_depth = (prev ? prev.depth : -1);
			var next_depth = (next ? next.depth : 0);
			minDepth = Math.min(prev_depth + 1, next_depth);
			maxDepth = Math.max(minDepth, prev_depth + 1);
			dropDepth = this.source.depth + Math.round((event.page.x - this.xOffset) / 40);
			dropDepth = Math.max(minDepth, Math.min(maxDepth, dropDepth));
		} else {
			dropDepth = 0;
		}

		// Check the drop location for viability
		var allowDrop = false;
		if(this.source.anchored) {
			if(this.source.depth >= minDepth && this.source.depth <= maxDepth)
				dropDepth = this.source.depth;

			if(dropDepth == this.source.depth) {
				// Limit the allowed drop locations to those under the old parent node.
				var node = this.oldParent;
				while(node && (node.depth >= this.source.depth))
					node = node.getPrevious();
				var allowablePrevNodes = [];
				do {
					if(!node && this.source.depth == 0) {
						allowablePrevNodes.push(node);
					} else if(node && (!node.getNext() || node.getNext().depth <= this.source.depth)) {
						allowablePrevNodes.push(node);
					}
					node = node ? node.getNext() : this.target.getParent().getFirst();
				} while(node && (node.depth >= this.source.depth));
				var cancelDrop = true;
				allowablePrevNodes.each(function(node) {
					if(node == dropAfter) {
						allowDrop = true;
					}
				});
			}
		} else {
			// maybe needs to change?
			allowDrop = true;
		}


		if(allowDrop) {
			if(dropAfter)
				this.target.injectAfter(dropAfter);
			else
				this.target.injectTop(this.target.getParent());
			this.target.depth = dropDepth;

			var left = this.list.offsetLeft + dropDepth * 40 + 5;
			var node = this.target.getPrevious();
			while(node && node.depth >= dropDepth) {
				node = node.getPrevious();
			}
			if(node) {
				var top = node.offsetTop + node.offsetHeight;
			} else {
				var top = 0;
			}
			var height = this.target.offsetTop - top + 12;

			this.target.getElements('span.title').each(function(title){
				var depth = title.original_padding + dropDepth * 40;
				title.setStyle('padding-left', depth + 18);
				title.setStyle('background-position', depth.toString() + 'px center');
			});
			this.marker.setStyles({
				'left': left,
				'top': top,
				'height': height,
				'width': 10,
				'display': 'block'
			});
		}
	},

	serialize: function(converter) {
		return this.list.getChildren().map(converter || function(el){
			return this.elements.indexOf(el);
		}, this);
	},

	end: function(){
		this.scroller.stop()

		document.removeListener('mousemove', this.bound.move);
		document.removeListener('mouseup', this.bound.end);
		$$(document.body).removeClass("sitemap_move");


		this.previousY = null;

		var depthAdjust = this.target.depth - this.source.depth;
		this.marker.remove();
		
		this.sources.each(function(el) {
			el.depth += depthAdjust;
			$E('input.depth', el).value = el.depth;
			markDirty();
			var depth = el.depth * 40;
			el.title_element.setStyle('padding-left', depth + 18);
			el.title_element.setStyle('background-position', depth.toString() + 'px center');
			el.title_element = null;
			el.injectBefore(this.target);
		}, this);
		this.target.remove();
		this.target = null;

		// Change the old parent into a leaf if necessary
		if(this.oldParent) {
			var child = this.oldParent.getNext();
			if(child && child.depth <= this.oldParent.depth) {
				this.oldParent.removeClass('expanded');
				this.oldParent.removeClass('collapsed');
			}
		}
		var newParent = this.source.getPrevious();
		while(newParent && newParent.depth >= this.source.depth)
			newParent = newParent.getPrevious();
		// And change the new parent into a folder if necessary
		if(newParent) {
			if(!newParent.hasClass('expanded')) {
				newParent.addClass('expanded');
				this.expand(null, newParent, true);
			}
		}
		this.oldParent = null;
		
		this.zebraStripeRows();
		this.fireEvent('onComplete', this.source);
	},

	zebraStripeRows: function() {
		var index = 0;
		this.list.getChildren().each(function(el) {
			if(!el.hasClass('hiddenNode')) {
				if(index % 2 == 0) {
					el.addClass('even');
					el.removeClass('odd');
				} else {
					el.addClass('odd');
					el.removeClass('even');
				}
				index += 1;
			}
		});
	}

});

Sitemap.implement(new Events, new Options);
