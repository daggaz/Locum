/**
 * Simple AJAX call with callback.
 */
function ajax(url, data, callback) {
	new XHR({
		onSuccess: callback,
		headers: {
			'X-CSRFToken': Cookie.get('csrftoken'),
		},
	}).send(url, data);
}

/**
 * Add a class to the specifed element if it doesn't already have it.
 */
function addClass(element, class_) {
	if (!element.className) {
		element.className = class_;
	} else if (class_) {
		if (!element.className.match(RegExp("\\b" + class_ + "\\b"))) {
			element.className = element.className + ' ' + class_;
		}
	}
}

/**
 * Remove a class from the specifed element if it has it.
 */
function removeClass(element, class_) {
	if (!element.className) {
		return;
	} else if (!element.className.match(RegExp("\\b" + class_ + "\\b"))) {
		return;
	} else {
		var re = RegExp("\\b" + class_ + "\\b")
		element.className = element.className.replace(re, '');
	}
}

/**
 * Set a function to be called when the page has finished loading.
 */
function addLoadEvent(func){
	var oldOnload = window.onload;
	if (typeof window.onload != 'function') {
		window.onload = func;
	} else {
		window.onload = function() {
			oldOnload();
			func();
		}
	}
}

/**
 * The main object which controls the resource browser popup.
 */
var ResourceBrowser = {
	path: '',
	refererWindow: null,
	field: null,
	height: 400,
	width: 600,
	type: 'image',
	selectedPath: '',

	/**
	 * Add the Resource Browser to the TinyMCE instance.
	 */
	apply: function() {
		if ('undefined' != typeof(window.tinyMCE)) {
			for (var i = 0; i < tinyMCE.configs.length; i++) {
				var config = tinyMCE.configs[i];
				config['file_browser_callback'] = 'ResourceBrowser.open';
			}
		}
	},

	/**
	 * Open up the ResourceBrowser window.
	 *
	 * TODO open in a modal window if TinyMCE is configured to
	 */
	open: function(field_name, url, type, win) {
		var popup = window.open(ResourceConstants.RESOURCES_BROWSER_URL,
			'',
			'width=' + ResourceBrowser.width +
			',height='+ ResourceBrowser.height +
			',resizable=1, status=no, menubar=0, scrollbars=yes');
		popup.focus();
		ResourceBrowser.refererWindow = win;
		ResourceBrowser.field = win.document.forms[0].elements[field_name];
		ResourceBrowser.type = type;
		ResourceBrowser.URL = url;
	},

	/**
	 * Prompt the user to create a new folder within the specified path.
	 */
	newFolder: function(path) {
		var validCharacters = '0123456789abcdefghijklmnopqrstuvwxyz' +
			'ABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
		var msg = '';
		var folderName = 'new_folder';
		var valid = true;
		
		var listing = document.getElementById('listing');
		if (path != '' && path != '.') {
			listing = document.getElementById('listing_' + path)
		}

		// Keep prompting till we get a valid value or the user clicks Cancel.
		do {
			var promptText = 'What would you like to call the new folder?';
			folderName = prompt(msg + promptText, folderName);
			if (folderName == null) return;
			msg = '';
			
			for (var i = 0; i < listing.fileList.length; i++) {
				if (listing.fileList[i] != null) {
					var name = listing.fileList[i]['name'].toLowerCase();
				 	if (name == folderName.toLowerCase()) {
						msg = 'ERROR: An item with that name already exists.\n';
						break;
					}
				}
			}
			if (msg == '') {
				for (var i = 0; i < folderName.length; i++) {
					if (validCharacters.indexOf(folderName.charAt(i)) == -1) {
						msg = 'ERROR: Folder names must contain only letters, '
							+ 'numbers, hypens and underscores.\n';
						break;
					}
				}
				if (msg == '' && folderName.length > 20)
					msg = 'ERROR: Folder names must be no more than 20 '
						+ 'characters in length.\n';			
			}

		} while (msg != '');

		var url = ResourceConstants.RESOURCES_API_NEW_FOLDER_URL
			+ path
			+ folderName
			+ '/';
		ajax(url, 'type=' + window.opener.ResourceBrowser.type, function(responseText) {
			var success = eval('(' + responseText + ')');
			if (success) {
				ResourceBrowser.path = path;
				ResourceBrowser.update();
			} else {
				alert('ERROR\n\nAn unexpected error occured while creating the folder.');
			}
		});
		
	},
	
	/**
	 * Updates the file listing.
	 */
	update: function() {
		var url = ResourceConstants.RESOURCES_API_BROWSER_URL;
		var data = 'path=' +
			ResourceBrowser.path +
			'&type=' +
			window.opener.ResourceBrowser.type;
		ajax(url, data, function(responseText) {
			var fileList = eval('(' + responseText + ')');
			var listing = document.getElementById('listing');
			
			if (ResourceBrowser.path != '' && ResourceBrowser.path != '.') {
				listing = document.getElementById('listing_' + ResourceBrowser.path)
			}

			// Remove the existing listing
			for (var i = listing.childNodes.length - 1; i >= 0; i--) {
				listing.removeChild(listing.childNodes[i]);
			}
			
			if (fileList.length == 0) {
				fileList[0] = null; // dummy entry to denote no files
			}
			
			listing.fileList = fileList;

			for (var i = 0; i < fileList.length; i++) {
			
				var li = document.createElement('li');
				if (i % 2) li.className = 'even';

				if (fileList[i] == null) {
					var em = document.createElement('em');
					var text = document.createTextNode('No files or folders');
					em.appendChild(text);
					li.appendChild(em);
					listing.appendChild(li);
					continue;
				}
				
				var name = fileList[i]['name'];
				var display = fileList[i]['display'];
				var path = fileList[i]['path'];
				var isdir = fileList[i]['isdir'];
				var isfile = fileList[i]['isfile'];
						
				var link = document.createElement('a');
				link.href = '#';
				link.path = path;
				link.filename = name;
				link.isfile = isfile;
				link.appendChild(document.createTextNode(display));
				
				if (isdir) {
					addClass(link, 'directory');
					link.onclick = function() {
						var li = this.parentNode;
						var uls = li.getElementsByTagName('ul');
						if (uls.length == 0) {
							ResourceBrowser.path = this.path + '/';
							if (ResourceBrowser.path.substring(ResourceBrowser.path.length - 2) == '//') {
								ResourceBrowser.path = ResourceBrowser.path.substring(0, ResourceBrowser.path.length - 1);
							}
							var ul = document.createElement('ul');
							ul.id = 'listing_' + ResourceBrowser.path;
							li.appendChild(ul);
							removeClass(this, 'directory')
							addClass(this, 'directory-open' + (isfile ? '-file' : ''))
							ResourceBrowser.update();
						} else {
							if (uls[0].style.display == 'none') {
								removeClass(this, 'directory')
								addClass(this, 'directory-open' + (isfile ? '-file' : ''))
								uls[0].style.display = '';
							} else {
								removeClass(this, 'directory-open' + (isfile ? '-file' : ''))
								addClass(this, 'directory')
								uls[0].style.display = 'none';
							}
						}

						if (this.isfile) {
							var as = document.getElementsByTagName('a');
							for (var i = 0; i < as.length; i++) {
								removeClass(as[i], 'selected');
							}
							addClass(this, 'selected');
							ResourceBrowser.selectedPath = this.path;
						}

						return false;
					}
				} else {
					link.onclick = function() {
						if (this.path.lastIndexOf('.') != -1) {
						
							var lastDot = this.path.lastIndexOf('.');
							var ext = this.path.substring(lastDot + 1).toLowerCase();
							
							var img = document.getElementById('preview_image');
							img.style.height = '';
							img.style.width = '';
							var parentWidth = 280;
							var parentHeight = 280;
							img.style.paddingTop = '';
							img.onload = function() {
								this.style.display = 'inline';
								var w = this.offsetWidth;
								var h = this.offsetHeight;
								
								if (w / h > parentWidth / parentHeight) {
									if (w > 280) {
										this.style.width = '280px';
									}
								} else {
									if (this.offsetHeight > 250) {
										this.style.height = '250px';
									}
								}
								this.style.paddingTop = 140 - this.offsetHeight / 2 + 'px';
							}
							
							if (ext == 'jpg' || ext == 'jpeg' || ext == 'png' || ext == 'gif') {
								var p = this.path;
								// Remove the RESOURCES_URL prefix if present
								if (p.substring(0, ResourceConstants.RESOURCES_URL.length) == ResourceConstants.RESOURCES_URL) {
									p = p.substring(ResourceConstants.RESOURCES_URL.length);
								}
								img.src = ResourceConstants.RESOURCES_URL + p;
							} else {
								img.src = ResourceConstants.RESOURCES_IMG_NO_PREVIEW_URL;
							}
						}
						
						var as = document.getElementsByTagName('a');
						for (var i = 0; i < as.length; i++) {
							removeClass(as[i], 'selected');
						}
						addClass(this, 'selected');
						
						if (window.opener.ResourceBrowser.type != 'file') {
							ResourceBrowser.selectedPath =
								ResourceConstants.RESOURCES_URL + this.path;
						} else {
							ResourceBrowser.selectedPath = this.path;
						}
						
						return false;
					}
				}
				
				li.appendChild(link);
				listing.appendChild(li);

			}

			var path = ResourceBrowser.path;
			if (path.substring(0, ResourceConstants.RESOURCES_URL.length) == ResourceConstants.RESOURCES_URL || window.opener.ResourceBrowser.type != 'file') {
	
				var li = document.createElement('li');
				addClass(li, 'toolbar');
				listing.appendChild(li);
				var toolbar = document.createElement('div');
				li.appendChild(toolbar);
				
				var form = document.createElement('form');
				
				var img = document.createElement('img');
				img.src = ResourceConstants.RESOURCES_IMG_NEW_FOLDER_URL;
				img.title = 'Create a new folder here';
				img.onmouseover = function() {
					addClass(this, 'hover');
				}
				img.onmouseout = function() {
					removeClass(this, 'hover');
				}
				img.onclick = function() {
					ResourceBrowser.newFolder(path);
				}
				toolbar.appendChild(img);
				
				img = document.createElement('img');
				img.src = ResourceConstants.RESOURCES_IMG_UPLOAD_URL;
				img.title = 'Upload a file to here';
				img.onmouseover = function() {
					addClass(this, 'hover');
				}
				img.onmouseout = function() {
					removeClass(this, 'hover');
				}
				img.onclick = function() {
					if (this.className.indexOf('on') == -1) {
						addClass(this, 'on');
						form.style.display = 'block';
						form.scrollIntoView();
					} else {
						removeClass(this, 'on');
						form.style.display = 'none';
					}
				}
				toolbar.appendChild(img);
				
				form.action = ResourceConstants.RESOURCES_API_UPLOAD_URL + path,
				form.method = 'post';
				form.target = 'uploader';
				form.encoding = 'multipart/form-data';
				
				form.onsubmit = function() {
					if (form.elements[0].value === '') {
						alert('ERROR\n\nPlease click the Browse.. button and' +
							'choose\nwhich file you would like to upload.');
						return false;
					}
					document.getElementById('uploading').style.display = 'block';
				}
				document.body.appendChild(form);
				
				var input = document.createElement('input');
				input.type = 'file';
				input.name = 'thefile';
				form.appendChild(input);
				
				var typeInput = document.createElement('input');
				typeInput.type = 'hidden';
				typeInput.name = 'type';
				typeInput.value = window.opener.ResourceBrowser.type;
				form.appendChild(typeInput);
				
				var typeInput = document.createElement('input');
				typeInput.type = 'hidden';
				typeInput.name = 'csrfmiddlewaretoken';
				typeInput.value = Cookie.get('csrftoken');
				form.appendChild(typeInput);
				
				var button = document.createElement('input');
				button.setAttribute('type', 'submit');
				button.setAttribute('value', 'Upload');
				form.appendChild(button);
				toolbar.appendChild(form);
			}
			
			ResourceBrowser.zebra();
		});
	}.bind(window),
	
	// restripes the file listing
	zebra: function() {
		var listing = document.getElementById('listing');
		var lis = listing.getElementsByTagName('li');
		var n = 0;
		for (var i = 0; i < lis.length; i++) {
			if (n % 2) {
				addClass(lis[i], 'even');
			} else {
				removeClass(lis[i], 'even');
			}
			n++;
		}
	},

	// Starts the file listing.
	run: function() {
		ResourceBrowser.update();
		
		// Reselect the previous value
		var current = window.opener.ResourceBrowser.field.value;
		if (current != '') {
			if (window.opener.ResourceBrowser.type != 'file') {
				// Remove the RESOURCES_URL/ prefix
				current = current.substring(ResourceConstants.RESOURCES_URL.length);
			}
			
			
			var listing = document.getElementById('listing');
			var path = '/';
			
			if (current.indexOf('/', 1) != -1) {
				do {
					var dir = current.substring(1, current.indexOf('/', 1));
					current = current.substring(current.indexOf('/', 1));
					var as = listing.getElementsByTagName('a');
					for (var i = 0; i < as.length; i++) {
						if (as[i].filename == dir) {
							as[i].onclick();
							break;
						}
					}
					path += dir + '/';
					listing = document.getElementById('listing_' + path)
					if (listing == null) break;
				} while (current.indexOf('/', 1) != -1);
			}
			
			if (listing != null) {
				var as = listing.getElementsByTagName('a');
				for (var i = 0; i < as.length; i++) {
					if (as[i].innerHTML == current.substring(1)) {
						as[i].onclick();
						break;
					}
				}
			}

		}
	},

	// Tidy up and set the resource in the parent window.
	destroy: function() {
		if (!window.opener) return;
		if (!window.opener.ResourceBrowser.refererWindow) return;
		var wlh = window.location.href;

		window.opener.ResourceBrowser.field.value = ResourceBrowser.selectedPath;
		if (!window.opener.ResourceBrowser.refererWindow.tinyMCE.configs[0].relative_urls) {
			var site = wlh.substring(0, wlh.indexOf('/', wlh.indexOf('://') + 3));
			window.opener.ResourceBrowser.field.value = site + window.opener.ResourceBrowser.field.value;
		}

		window.opener.ResourceBrowser.refererWindow.focus();
		//window.opener.ResourceBrowser.field.onchange();
		window.close();
	}
};


if (typeof(isBrowser) == 'undefined') {
	addLoadEvent(ResourceBrowser.apply);
}