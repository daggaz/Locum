

var ModalDialog = new Class({

	viewWidth: 100,
	viewHeight: 100,

	initialize: function(options) {
		
		ModalDialog.instances.push(this);
		
		document.body.style.height = '100%';
		
		this.overlay = new Element('div');
		this.overlay.setStyles({
			backgroundColor: '#000',
			display: 'none',
			left: 0,
			position: 'absolute',
			zIndex: 1000000
			});
		this.overlay.setOpacity(0.8);
		
		this.loadingMessage = new Element('div');
		this.loadingMessage.setStyles({
			color: '#999',
			fontSize: 'large',
			fontWeight: 'bold',
			left: '50%',
			lineHeight: 'normal',
			marginLeft: '-5em',
			position: 'absolute',
			textAlign: 'center',
			width: '10em',
			zIndex: 1000001
			});
		this.loadingMessage.setText('Please wait...')

		if(window.ie6 || window.gecko) {
			// Chuck an extra iframe inside the overlay to prevent selects (in IE6)
			// or scrollbars (Firefox) from sitting on top of the dialog.
			var hack = new Element('iframe', {
				frameborder: '0',
				styles: {
					border: 'none',
					width: '100%',
					height: '100%'
				}
			});
			hack.setOpacity(0.01);
			hack.injectInside(this.overlay);
		}

		this.overlay.addEvent('click', function() {
			this.setStyle('backgroundColor', '#fff');
			(function() {
				this.setStyle('backgroundColor', '#000');
			}).bind(this).delay(50);
		}.bind(this.overlay));

		this.dialogVisible = false;
		this.dialog = new Element('div');
		this.dialog.setStyles({
			backgroundColor: '#ddd',
			display: 'none',
			fontFamily: 'sans-serif',
			fontSize: '10pt',
			padding: '10px',
			position: 'absolute',
			visibility: 'hidden',
			zIndex: 1000000
		});

		this.content = new Element('div');
		this.content.setStyles({
			backgroundColor: '#fff',
			padding: '10px',
			overflow: 'auto'
		});
		this.dialog.appendChild(this.content);

		this.buttonContainer = new Element('div');
		this.buttonContainer.setStyles({
			padding: '15px 0 5px',
			textAlign: 'right'
		});
		this.dialog.appendChild(this.buttonContainer);

		$(document.body).adopt(this.overlay, this.loadingMessage, this.dialog);

		// Show the overlay to try to prevent the user from performing other
		// actions while the dialog is loading 
		this.resize();

		this.boundResize = this.resize.bind(this);
		window.addEvent('resize', this.boundResize);
		window.addEvent('scroll', this.boundResize);

		var options = Object.extend({
			buttons: [['OK', Class.empty]],
			content: null,
			url: '',
			loader: 'ajax', // 'ajax' or 'iframe'
			method: 'get',
			data: '',
			evalScripts: false, // only applies to ajax
			height: 400,
			width: 500,
			loaderFailureMessage: '<p><strong>An error occurred:</strong> $STATUSCODE $STATUSTEXT</p><p>Please try again</p>',
			onClose: false
		}, options || {});
		
		if(typeof(options.content) == "string") {
		    this.content.innerHTML = options.content;
        } else {
			if(options.content)
	            this.content.adopt(options.content);
        }
		
		this.setButtons(options.buttons);

		this.viewHeight = options.height;
		this.viewWidth = options.width;
		
		this.overlay.setStyle('display', 'block');
		
		if (options.onClose) {
			this.addEvent('close', options.onClose); 
		}


		var showDialog = (function() {
			// Now size everything and show the dialog
			this.dialogVisible = true;
			this.loadingMessage.remove()
			this.resize();
			
			// If there are any form elements within the dialog, focus on the
			// first one, otherwise focus on the first button
			var formElements = this.content.getElementsBySelector('input, select, textarea');
			if (formElements.length > 0) {
				formElements[0].focus();
			} else {
				this.buttonContainer.firstChild.focus();
			}
		}).bind(this);

		if (options.url) {
			if (options.loader == 'iframe') {
				var iframe = new Element('iframe', {
					'styles': {
						'backgroundColor': '#fff',
						'border': 'none'
					},
					'frameborder': '0',
					'name': ('modal_iframe' + Math.round(Math.random() * 10000)),
					'src': (options.method == 'get' ? options.url : null)
				});
				iframe.addEvent('load', showDialog);
				this.content.replaceWith(iframe);
				this.content = iframe;
				
				if(options.method == 'post') {
					var form = new Element('form', {
						'target': this.content.name,
						'method': 'post',
						'action': options.url
					});
					for(var key in options.data) {
						form.adopt(new Element('input', {
							'type': 'hidden',
							'name': key,
							'value': options.data[key]
						}));
					}
					form.injectAfter(this.content);
					form.submit();
					form.remove();
				}
				
			} else {
				var ajaxOptions = {
					update: $(this.content),
					method: options.method,
					data: options.data,
					evalScripts: options.evalScripts,
					onSuccess: showDialog,
					onFailure: (function(xhr) {
						var message = options.loaderFailureMessage;
						var status = xhr.status.toString();
						var statusText = xhr.statusText.toString().toLowerCase().capitalize();
						message = message.replace("$STATUSCODE", status).replace("$STATUSTEXT", statusText);
						$(this.content).setHTML(message);
						this.setButtons([['OK', Class.empty]]);
					}).bind(this)
				};
				new Ajax(options.url, ajaxOptions).request();
			}
		} else {
			showDialog();
		}
	},
	
	close: function(arg) {
		this.fireEvent('close', [this, arg]);
		window.removeEvent('scroll', this.boundResize);
		window.removeEvent('resize', this.boundResize);
		this.overlay.remove();
		this.dialog.remove();
		ModalDialog.instances.remove(this);
	},
	
	setButtons: function(buttons) {
		this.buttonContainer.innerHTML = '';
		for (var i = 0; i < buttons.length; i++) {
			var button = new Element('a', {
				'class': 'button' + (i == 0 ? ' default' : ''),
				'href': '#',
				'styles': {'margin-left': '10px'}
				});
			button.setText(buttons[i][0]);
			button.addEvent('click', function(event, text, callback) {
				// If the callback function returns true, then the dialog remains open
				if (!callback(this)) {
					this.close(text);
				}
				event.stop();
			}.bindWithEvent(this, buttons[i]));
			this.buttonContainer.appendChild(button);
		}
	},
	
	resize: function() {

		// We need to hide the modal elements in order to calculate the correct dimensions of the documentElement.
		this.overlay.setStyle('display', 'none');
		this.dialog.setStyle('display', 'none');
		var screenHeight = document.documentElement.scrollHeight;
		var screenWidth = document.documentElement.scrollWidth;
		var clientHeight = document.documentElement.clientHeight;
		var clientWidth = document.documentElement.clientWidth;
		var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
		this.overlay.setStyle('display', 'block');
		this.dialog.setStyle('display', 'block');

		this.overlay.setStyles({
			height: screenHeight,
			width: screenWidth,
			left: 0,
			top: 0
			});

		// This is disabled right now because it's buggy in IE.
		var iframeDocument = this.content.contentDocument || this.content.document;
		if (false && this.content.tagName == 'IFRAME' && this.viewHeight == 'auto' && iframeDocument) {
			this.content.setStyle('height', 100);
			var documentHeight = iframeDocument.documentElement.offsetHeight;
			var contentHeight = Math.max(Math.min(documentHeight, (screenHeight * 0.8) - (this.buttonContainer.offsetHeight - 30)), 100);
		} else {
			var contentHeight = this.viewHeight;
		}
			
		this.content.setStyles({
			height: contentHeight,
			width: this.viewWidth
			});

		var top = scrollTop + (clientHeight - this.content.offsetHeight) / 3 - 10;
		this.dialog.setStyles({
			left: (clientWidth - this.content.offsetWidth) / 2 - 10,
			top: top,
			visibility: this.dialogVisible ? 'visible' : 'hidden'
			});
		this.loadingMessage.setStyle('top', top);

	}

});
ModalDialog.implement(new Events);

// Record the open ModalDialogs
ModalDialog.instances = new Array();

// Retrieve the topmost open ModalDialog (or null if there are none open)
ModalDialog.getTopmost = function() {
	return ModalDialog.instances.getLast();
}

// Close the topmost open ModalDialog (if there is one);
ModalDialog.close = function(arg) {
	var topmost = ModalDialog.getTopmost();
	if (topmost) topmost.close(arg);
}

// Shortcut method to show a simple message
ModalDialog.alert = function(msg, callback, options) {
	return new ModalDialog(Object.extend({
		buttons: [
			['OK', function(modalDialog) { if(callback) { callback(true); } }],
			],
		content: msg,
		height: 'auto',
		width: 250
	}, options || {}));
}

ModalDialog.confirm = function(msg, callback, options) {
	new ModalDialog(Object.extend({
		buttons: [
			['OK', function(modalDialog) { callback(true); }],
			['Cancel', function(modalDialog) { callback(false); }]
			],
		content: msg,
		height: 'auto',
		width: 250
	}, options || {}));
};

var TimeOutModalDialog = ModalDialog.extend({
	initialize: function(options) {
		options = Object.extend({
			timeOut: 10000,
			startTimer: true,
			timeOutMessage: null,
			timeOutCallback: null
		}, options || {});

		this.parent(options);

		if(this.buttons && !options.timeOutCallback)
			options.timeOutCallback = this.buttons[0][1];

		this.timeOut = options.timeOut
		if(options.startTimer)
			this.startTimer(options.timeOutMessage, options.timeOutCallback);
	},

	endTimer: function() {
		if(this.timer)
			clearTimeout(this.timer);
	},

	startTimer: function(timeOutMessage, timeOutCallback) {
		this.endTimer();

		this.timer = setTimeout(
			function() {
				var closeDialog = (function() {
					timeOutCallback.bind(this)();
					this.close('timeout');
				}).bind(this);

				if(timeOutMessage)
					ModalDialog.alert(timeOutMessage, closeDialog);
				else
					closeDialog();
			}.bind(this),
			this.timeOut
		);
	},
	
	close: function(arg) {
		this.endTimer();
		this.parent(arg);
	}
});


// TEST:
// window.addEvent("load", function() {
	// new ModalDialog({'url': '/', loader: 'iframe', height: 'auto'});
	// ModalDialog.alert("Hello world");
	// ModalDialog.confirm("This is a very long piece of prompt text designed to test what the dialog box will do in order to display it to the user!",
		// function(x) {
			// ModalDialog.alert(x);
		// }
	// );
// 	//ModalDialog.alert('Hello', {buttons:[['help', function(){ return false; }]]});
// });

/*
document.addEvent("keydown", function(event) {	
	if (event.keyCode == 9) {
		document.title = new Date();
		new Event(event).stop();
		return false;
	}
});
*/
