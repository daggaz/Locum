var ImageCropper = {

	image: null,
	boundHandle: -1,
	moveAnchor: null,

	init: function(image) {
	
		this.image = $(image);
		
		this.cropArea = document.createElement('div');
		this.cropArea.style.border = '1px solid #000';
		this.cropArea.style.background = 'transparent';
		this.cropArea.style.height = (this.image.offsetHeight - 2) + 'px';
		this.cropArea.style.width = (this.image.offsetWidth - 2) + 'px';
		this.cropArea.style.top = (this.image.offsetTop) + 'px';
		this.cropArea.style.left = (this.image.offsetLeft) + 'px';
		this.cropArea.style.position = 'absolute';
		this.cropArea.style.cursor = 'move';
		this.image.parentNode.appendChild(this.cropArea);
		
		var moveHandler = function(event) {
			var x = Event.pointerX(event);
			var y = Event.pointerY(event);
		    var pos = Position.cumulativeOffset(this.cropArea);
			this.moveAnchor = [x - pos[0], y - pos[1]];
		}
		
		Event.observe(this.cropArea, 'mousedown', moveHandler.bindAsEventListener(this));
		Event.observe(this.image, 'mousedown', moveHandler.bindAsEventListener(this));
		Event.observe(document, 'selectstart', function(event) {
			Event.stop(event);
		});
		Event.observe(document, 'dragstart', function(event) {
			Event.stop(event);
		});

		Event.observe(document, 'mouseup', function(event) {
			this.boundHandle = -1;
			this.moveAnchor = null;
		}.bindAsEventListener(this));
		
		Event.observe(window, 'resize', this.refresh.bindAsEventListener(this));
		
		Event.observe(document, 'mousemove', function(event) {

			if (this.boundHandle < 0 && this.moveAnchor == null) return;
		
			var x = Event.pointerX(event);
			var y = Event.pointerY(event);
		    var pos = Position.cumulativeOffset(this.cropArea);
		    var right = this.cropArea.offsetLeft + this.cropArea.offsetWidth;
		    var bottom = this.cropArea.offsetTop + this.cropArea.offsetHeight;
		    
		    if (this.moveAnchor) {
				
				this.cropArea.style.left = (x - this.moveAnchor[0]) + 'px'
				this.cropArea.style.top = (y - this.moveAnchor[1]) + 'px'
				
				if (this.cropArea.offsetLeft < this.image.offsetLeft) {
					this.cropArea.style.left = this.image.offsetLeft + 'px';
				}
				if (this.cropArea.offsetTop < this.image.offsetTop) {
					this.cropArea.style.top = this.image.offsetTop + 'px';
				}
				if (this.cropArea.offsetLeft + this.cropArea.offsetWidth > this.image.offsetLeft + this.image.offsetWidth) {
					this.cropArea.style.left = (this.image.offsetWidth - this.cropArea.offsetWidth + this.image.offsetLeft) + 'px';
				}
				if (this.cropArea.offsetTop + this.cropArea.offsetHeight > this.image.offsetTop + this.image.offsetHeight) {
					this.cropArea.style.top = (this.image.offsetHeight - this.cropArea.offsetHeight + this.image.offsetTop) + 'px';
				}
				
		    } else {

				if (x < this.image.offsetLeft) {
					x = this.image.offsetLeft;
				}
				if (y < this.image.offsetTop) {
					y = this.image.offsetTop;
				}

				switch (this.boundHandle) {
					case 0:
						this.cropArea.style.left = x + 'px'
						this.cropArea.style.top = y + 'px'
						this.cropArea.style.width = (right - x - 2) + 'px'
						this.cropArea.style.height = (bottom - y - 2) + 'px'
						break;
					case 1:
						this.cropArea.style.top = y + 'px'
						this.cropArea.style.width = (x - pos[0]) + 'px'
						this.cropArea.style.height = (bottom - y - 2) + 'px'
						break;
					case 2:
						this.cropArea.style.left = x + 'px'
						if (this.cropArea.offsetLeft < this.image.offsetLeft) {
							this.cropArea.style.left = this.image.offsetLeft + 'px';
						}
						this.cropArea.style.width = (right - x - 2) + 'px'
						this.cropArea.style.height = (y - pos[1]) + 'px'
						break;
					case 3:
						this.cropArea.style.width = (x - pos[0]) + 'px'
						this.cropArea.style.height = (y - pos[1]) + 'px'
						break;
				}
				
				if (this.cropArea.offsetLeft + this.cropArea.offsetWidth > this.image.offsetLeft + this.image.offsetWidth) {
					this.cropArea.style.width = (this.image.offsetWidth - this.cropArea.offsetLeft + this.image.offsetLeft - 2) + 'px';
				}
				if (this.cropArea.offsetTop + this.cropArea.offsetHeight > this.image.offsetTop + this.image.offsetHeight) {
					this.cropArea.style.height = (this.image.offsetHeight - this.cropArea.offsetTop + this.image.offsetTop - 2) + 'px';
				}

			}			
			
			this.refresh();

		}.bindAsEventListener(this));
		
		this.shadows = [];
		for (var i = 0; i < 4; i++) {
			var shadow = document.createElement('div');
			shadow.style.background = '#000';
			shadow.style.position = 'absolute';
			shadow.style.opacity = '0.25';
			shadow.style.fontSize = '1px';
			shadow.style.filter = 'Alpha(opacity=25)';
			this.image.parentNode.appendChild(shadow);
			this.shadows[i] = shadow;
		}
		
		this.handles = [];
		for (var i = 0; i < 4; i++) {
			var handle = document.createElement('div');
			handle.style.border = '1px solid #000';
			handle.style.background = '#fff';
			handle.style.fontSize = '1px';
			handle.style.width = '6px';
			handle.style.height = '6px';
			handle.style.position = 'absolute';
			handle.editor = this;
			handle.index = i;
			Event.observe(handle, 'mousedown', function(event) {
				this.editor.boundHandle = this.index;
			}.bindAsEventListener(handle));
			this.image.parentNode.appendChild(handle);
			this.handles[i] = handle;
		}
		
		this.handles[0].style.cursor = 'nw-resize';
		this.handles[1].style.cursor = 'ne-resize';
		this.handles[2].style.cursor = 'sw-resize';
		this.handles[3].style.cursor = 'se-resize';
				
		this.refresh();
		
	},
	
	refresh: function() {

		this.shadows[0].style.width = (this.image.offsetWidth) + 'px';
		this.shadows[0].style.height = (this.cropArea.offsetTop - this.image.offsetTop) + 'px';
		this.shadows[0].style.top = (this.image.offsetTop) + 'px';
		this.shadows[0].style.left = (this.image.offsetLeft) + 'px';
		this.shadows[0].style.display = (this.cropArea.offsetTop - this.image.offsetTop > 0) ? '' : 'none';
		
		this.shadows[1].style.width = (this.cropArea.offsetLeft - this.image.offsetLeft) + 'px';
		this.shadows[1].style.height = (this.cropArea.offsetHeight) + 'px';
		this.shadows[1].style.top = (this.cropArea.offsetTop) + 'px';
		this.shadows[1].style.left = (this.image.offsetLeft) + 'px';
	
		this.shadows[2].style.width = (this.image.offsetWidth - this.cropArea.offsetLeft - this.cropArea.offsetWidth + this.image.offsetLeft) + 'px';
		this.shadows[2].style.height = this.cropArea.offsetHeight + 'px';
		this.shadows[2].style.top = (this.cropArea.offsetTop) + 'px';
		this.shadows[2].style.left = (this.cropArea.offsetLeft + this.cropArea.offsetWidth) + 'px';
		
		this.shadows[3].style.width = (this.image.offsetWidth) + 'px';
		this.shadows[3].style.height = (this.image.offsetHeight - this.cropArea.offsetHeight - this.cropArea.offsetTop + this.image.offsetTop) + 'px';
		this.shadows[3].style.top = (this.cropArea.offsetTop + this.cropArea.offsetHeight) + 'px';
		this.shadows[3].style.left = (this.image.offsetLeft) + 'px';
		this.shadows[3].style.display = (this.image.offsetHeight - this.cropArea.offsetHeight - this.cropArea.offsetTop + this.image.offsetTop > 0) ? '' : 'none';

		this.handles[0].style.left = (this.cropArea.offsetLeft - 3) + 'px';
		this.handles[0].style.top = (this.cropArea.offsetTop - 3) + 'px';
		this.handles[1].style.left = (this.cropArea.offsetLeft + this.cropArea.offsetWidth - 4) + 'px';
		this.handles[1].style.top = (this.cropArea.offsetTop - 3) + 'px';
		this.handles[2].style.left = (this.cropArea.offsetLeft - 3) + 'px';
		this.handles[2].style.top = (this.cropArea.offsetTop + this.cropArea.offsetHeight - 4) + 'px';
		this.handles[3].style.left = (this.cropArea.offsetLeft + this.cropArea.offsetWidth - 4) + 'px';
		this.handles[3].style.top = (this.cropArea.offsetTop + this.cropArea.offsetHeight - 4) + 'px';	
	},
	
	getCrop: function() {
		return [
			this.cropArea.offsetLeft - this.image.offsetLeft,
			this.cropArea.offsetTop - this.image.offsetTop,
			this.cropArea.offsetWidth,
			this.cropArea.offsetHeight
			];
	}

}

var ImageResizer = {

	image: null,
	resizing: false,

	init: function(image) {
	
		this.image = $(image);
		
		Event.observe(document, 'selectstart', function(event) {
			Event.stop(event);
		});
		Event.observe(document, 'dragstart', function(event) {
			Event.stop(event);
		});

		Event.observe(document, 'mouseup', function(event) {
			this.boundHandle = -1;
		}.bindAsEventListener(this));
		
		Event.observe(document, 'mousemove', function(event) {

			if (!this.resizing) return;
		
			this.refresh();

		}.bindAsEventListener(this));
		
		this.handle = document.createElement('div');
		this.handle.style.border = '1px solid #000';
		this.handle.style.background = '#fff';
		this.handle.style.fontSize = '1px';
		this.handle.style.width = '6px';
		this.handle.style.height = '6px';
		this.handle.style.position = 'absolute';
		this.handle.style.cursor = 'se-resize';
		Event.observe(this.handle, 'mousedown', function(event) {
			this.resizing = true;
		}.bindAsEventListener(this));
		this.image.parentNode.appendChild(this.handle);
		
		this.refresh();
		
	},
	
	refresh: function() {
		this.handle.style.left = (this.image.offsetLeft + this.image.offsetWidth - 4) + 'px';
		this.handle.style.top = (this.image.offsetTop + this.image.offsetHeight - 4) + 'px';	
	}

}