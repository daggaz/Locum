// This is the element in the page which contains the content and should scroll
// vertically if required.
var defaultContentContainer = null;
var contentContainer = null;
var contentContainerCallback = null;


function setContentContainer(element, callback) {
	if(typeof(callback) == "undefined")
		callback = null;
	contentContainerCallback = callback;
	if ($(element) != contentContainer) {
		if (contentContainer != null) {
			contentContainer.style.height = 'auto';
		}
		contentContainer = $(element);
		handleResize();
	}
}


function handleResize() {
	initAdmin();
	if (!contentContainer) return;

	var clientWidth, clientHeight;
	if (self.innerHeight) {
		clientWidth = self.innerWidth;
		clientHeight = self.innerHeight;
	} else {
		clientWidth = document.documentElement.clientWidth;
		clientHeight = document.documentElement.clientHeight;
	}

	$('page').style.height = clientHeight + 'px';
	function getOffset(el) {
		x = 0; y = 0;
		while(el) {
			x += el.offsetLeft;
			y += el.offsetTop;
			el = el.offsetParent;
		}
		return {'x': x, 'y': y}
	}
	var paneHeight = clientHeight - getOffset(contentContainer).y;
	if ($('footer')) paneHeight -= Math.min(100, $('footer').offsetHeight);
	contentContainer.style.height = paneHeight + 'px';

	if (clientWidth < 975) {
		$('page').style.width = '100%';
	} else {
		$('page').style.width = '975px';
	}

	if(contentContainerCallback)
		contentContainerCallback();
}


var TableHelper = new Object();
Object.extend(TableHelper, {

	zebraStripeRows: function(tables) {
		$A(tables).each(function(table) {
			var tbodies = table.getElementsByTagName('tbody');
			$A(tbodies).each(function(tbody) {
				var trs = tbody.getElementsByTagName('tr');
				for (var j = 0; j < trs.length; j++) {
					$(trs[j]).addClass(j % 2 == 0 ? 'odd' : 'even');
				}
			});
		});
	},

	decapitate: function(tables) {
		$A(tables).each(function(table) {
			var head = table.getElementsByTagName('thead')[0];
			var container = head.parentNode.parentNode;
			var disembodiedTable = document.createElement('table');
			disembodiedTable.cellSpacing = '0';
			disembodiedTable.className = 'tabular';
			disembodiedTable.style.width = table.offsetWidth + 'px';
			var disembodiedHead = document.createElement('thead');
			disembodiedTable.appendChild(disembodiedHead);
			var trs = head.getElementsByTagName('tr');
			for (var j = 0; j < trs.length; j++) {
				var tr = document.createElement('tr');
				disembodiedHead.appendChild(tr);
				var ths = trs[j].getElementsByTagName('th');
				var widthSum = 0;
				for (var k = 0; k < ths.length; k++) {
					var th = document.createElement('th');
					tr.appendChild(th);
					th.innerHTML = ths[k].innerHTML;
					th.className = ths[k].className;
					if (k < ths.length - 1) {
						th.style.width = ths[k].offsetWidth + 'px';
						widthSum += ths[k].offsetWidth;
					} else {
						th.style.width = table.offsetWidth - widthSum + 'px';
					}
				}
			}
			head.className = 'hidden';
			
			var wrapper = new Element('div');
			wrapper.style.clear = 'both';
			wrapper.style.overflow = 'hidden';
			wrapper.appendChild(disembodiedTable);
			container.parentNode.insertBefore(wrapper, container);

			$(container).addEvent('scroll', function() {
				wrapper.scrollLeft = container.scrollLeft;
			});

			window.addEvent('resize', function() {
				disembodiedTable.style.width = table.offsetWidth + 'px';
				var oldTrs = head.getElementsByTagName('tr');
				var newTrs = disembodiedHead.getElementsByTagName('tr');
				for (var i = 0; i < oldTrs.length; i++) {
					var oldThs = oldTrs[i].getElementsByTagName('th');
					var newThs = newTrs[i].getElementsByTagName('th');
					var widthSum = 0;
					for (var j = 0; j < oldThs.length - 1; j++) {
						newThs[j].style.width = oldThs[j].offsetWidth + 'px';
						widthSum += oldThs[j].offsetWidth;
					}
					newThs[newThs.length - 1].style.width = (table.offsetWidth - widthSum) + 'px';
				}
			});
		});
	}

});

var fullPaneResizeCallback = function() {
	var child = $(contentContainer).getFirst();
	var target_size = $(contentContainer).getCoordinates();
	var child_size = child.getCoordinates();
	if(child) {
		// Reset the child's border, margin, and padding so we don't have to adjust for it
		if(child.tagName.toLowerCase() == 'input' || child.tagName.toLowerCase() == 'textarea') {
			borderWidth = 1;
			child.style.border = borderWidth + "px solid #858585";
		} else {
			borderWidth = 0;
			child.style.border = "none";
		}
		child.style.margin = "0";
		child.style.padding = "0";

		// Now resize it
		child.style.width = (target_size.width - borderWidth * 2) + "px";
		child.style.height = (target_size.height - (child_size.top - target_size.top) - borderWidth * 2) + "px";
	}
};

var tinymceResizeCallback = function() {
	//The editor as a whole is contained in a span.mceEditorContainer;
	//then table.mceEditor is the span's first child;
	//and it contains iframe.mceEditorIframe

	target_size = $(contentContainer).getCoordinates();

	// This will likely fail for non-standard css and/or configuration of tinymce
	var tables = contentContainer.getElementsBySelector("table.mceEditor");
	var table = (tables.length > 0) ? tables[0] : null;
	if(!table)
		return;
	var table_size = $(table).getCoordinates();


	var toolbars = table.getElementsBySelector("td.mceToolbarTop");
	var toolbar = (toolbars.length > 0) ? toolbars[0] : null;
	if(toolbar) {
		var toolbar_size = $(toolbar).getCoordinates();
	} else {
		var toolbar_size = {'width': 0, 'height': 0};
	}

	var iframes = table.getElementsBySelector("iframe.mceEditorIframe");
	var iframe = (iframes.length > 0) ? iframes[0] : null;
	var iframe_cell = iframe.parentNode;

	// Reset the iframe and containing cell's border & padding so we don't have to adjust for it
	iframe.style.border = "none";
	iframe.style.padding = "0";
	iframe_cell.style.border = "none";
	iframe_cell.style.padding = "0";

	// Account for borders (assume border widths are in pixels)
	width_adjust = (parseInt(Element.getStyle(table, 'border-left-width')) || 0) + (parseInt(Element.getStyle(table, 'border-right-width')) || 0);
	height_adjust = (parseInt(Element.getStyle(table, 'border-top-width')) || 0) + (parseInt(Element.getStyle(table, 'border-bottom-width')) || 0) +
		(parseInt(Element.getStyle(toolbar, 'border-top-width')) || 0) + (parseInt(Element.getStyle(toolbar, 'border-bottom-width')) || 0) + 1;

	// Now resize the table and iframe
	table.style.width = target_size.width + "px";
	table.style.height = target_size.height + "px";
	iframe.style.width = (target_size.width - width_adjust) + "px";
	iframe.style.height = (target_size.height - toolbar_size.height - height_adjust) + "px";
};


var TabHelper = new Object();
Object.extend(TabHelper, {

	initialize: function (tabControl, insertBefore, activeTab) {

		tabControl = $(tabControl);
		insertBefore = $(insertBefore);

		var tabs = document.createElement('div');
		tabs.className = 'tabs';
		insertBefore.parentNode.insertBefore(tabs, insertBefore);

		var tabPanes = $(tabControl).getElements('.tab_pane');
		$A(tabPanes).each(function(tabPane) {

			tabPane.tabPanes = tabPanes;

			var tab = $E('h2', tabPane);
			var tabHasErrors = (Element.getElementsBySelector(tabPane, 'ul.errorlist').length > 0)
			if(tabHasErrors)
				tab.addClass('tab_errors');
			var a = $(document.createElement('a'));
			a.innerHTML = tab.innerHTML;
			a.href = '#' + tabPane.id;
			a.addEvent('click', function(event) {
				TabHelper.setFocus(tabPane);
				this.blur();
				(new Event(event)).stop();
			}.bindWithEvent(a));
			tab.innerHTML = '';
			tab.appendChild(a);
			tab.tabPane = tabPane;
			tab.tabPanes = tabPanes;
			tab.tabControl = tabControl;
			tabPane.tab = tab;
			tabs.appendChild(tab);

		});

		var errorTabs = $(tabs).getChildren().filterByClass('tab_errors');
		var firstErrorTab = (errorTabs.length > 0) ? errorTabs[0] : null;
		TabHelper.setFocus($(activeTab) || (firstErrorTab && firstErrorTab.tabPane) || tabs.firstChild.tabPane);

		handleResize();

	},

	setFocus: function(tabPane) {
		$A(tabPane.tabPanes).each(function(t) {
			if (tabPane == t) {
				$(t.tab).addClass('current');
				t.style.display = '';
			} else {
				$(t.tab).removeClass('current');
				t.style.display = 'none';
			}
		});
		var tabPaneElement = $(tabPane);
		if (tabPaneElement.hasClass('tinymce_pane')) {
			// Allow id='tinymce' for backward compatibility
			var container = $E('.tinymce', tabPaneElement) || $E('#tinymce', tabPaneElement);
			setContentContainer(container, tinymceResizeCallback);
		} else if ($(tabPane).hasClass('fulltab_pane')) {
			var container = $E('.fulltab', tabPaneElement);
			setContentContainer(container, fullPaneResizeCallback);
		} else {
			setContentContainer('content');
		}
	}

});


var FilterHelper = new Object();
Object.extend(FilterHelper, {
	initialize: function() {
		var toggleFilter = document.createElement('div');
		toggleFilter.className = 'toggle_filter';
		var link = document.createElement('a');
		if ($('filter').className == 'hidden') {
			$('filter').setStyle('display', 'none');
			link.className = 'show';
			link.innerHTML = 'Filter';
		} else {
			link.className = 'hide';
			link.innerHTML = 'Hide filter';
		}
		toggleFilter.appendChild(link);
		var searchDiv = $('search');

		// Insert the toggle link just before the last primary filter, or,
		// (if there are none), just before the other filters.
		lastPrimaryFilter = $('filter').previousSibling;
		while(lastPrimaryFilter && lastPrimaryFilter.nodeType != 1)
			lastPrimaryFilter = lastPrimaryFilter.previousSibling;
		if(!lastPrimaryFilter)
			lastPrimaryFilter = $('filter');
		searchDiv.insertBefore(toggleFilter, lastPrimaryFilter);
		$(link).addEvent('click', function(event) {
			if (this.className == 'show') {
				$('filter').setStyle('display', '');
				this.innerHTML = 'Hide filter';
				this.className = 'hide';
			} else {
				$('filter').setStyle('display', 'none');
				this.innerHTML = 'Filter';
				this.className = 'show';
			}
			handleResize();
		}.bindWithEvent(link));

		// Remove all the submit buttons from the filter panel
		$A($('filter').getElementsByTagName('input')).each(function(input) {
			if (input.type == 'submit') {
				input.parentNode.removeChild(input);
			}
		});

		// Submit the form when a filter <select> value is changed
		$A($('filter').getElementsByTagName('select')).each(function(input) {
			$('input').addEvent('change', input.form.submit);
		});

	}
});

mt_admin_initialised = false;
function initAdmin() {
	if(mt_admin_initialised)
		return;
	mt_admin_initialised = true;
	window.addEvent('resize', handleResize);

	if ($('filter')) FilterHelper.initialize();

	setContentContainer(defaultContentContainer || 'content');

	if ($('form_tabs')) {
		if (document.location.hash) {
			var activeTab = $(document.location.hash.substring(1));
			TabHelper.initialize('form_tabs', 'content', activeTab);
		} else {
			TabHelper.initialize('form_tabs', 'content');
		}
	}

	TableHelper.zebraStripeRows($ES('table.striped'));

	if ($('object_list')) {
		TableHelper.decapitate([$('object_list')]);
		handleResize(); // second call to hanldeResize is deliberate
	}

	// Prevent edit forms from being submitted when enter is pressed
	function stopOnEnter(event) {
		if (event.keyCode == 13) {
			event.preventDefault();
			event.stopPropagation();
		}
	}
	$$('#edit_form input').each(function(input) {
		input.addEvent('keydown', stopOnEnter.bindWithEvent());
	});

	// Warn the user if they try to leave an edit form without saving
	if ($('edit_form')) {
		window.markDirty = function() { $('edit_form')._dirty = true; };
		window.markNotDirty = function() { $('edit_form')._dirty = false; };
		addMarkDirtyEvent = function(element) {
			element.addEvent('change', markDirty);
		};
		$$('#edit_form input').each(addMarkDirtyEvent);
		$$('#edit_form textarea').each(addMarkDirtyEvent);
		$$('#edit_form select').each(addMarkDirtyEvent);
		$$('#footer div.actions a').each(function(element) {
			element.addEvent('click', markNotDirty);
		});
		$('edit_form').addEvent('submit', markNotDirty);
		window.addEvent('beforeunload', function(event) {
			if ($('edit_form')._dirty) {
				event.returnValue = 'Changes have NOT yet been saved and will be lost.';
			}
		});
		// A form with errors should be considered dirty
		if($E('#edit_form .errorlist')) {
			markDirty();
		}
	}

	// Ensure that the standard browser horizontal scroll bar is never shown
	var html = document.getElementsByTagName('html')[0];
	html.style.overflowX = 'auto';
	html.style.overflowY = 'hidden';

	// Links which have class="new_window" open new windows:
	function newWindowLinks() {
		$ES('a.new_window').each(function(elem, index) {
			elem.addEvent('click', function(event) {
				window.open(elem.href);
				(new Event(event)).stop();
			});
		});
	};

	newWindowLinks();
};

window.addEvent('load', handleResize);
window.addEvent('domready', initAdmin);

// window.addEvent('load', function(event) {
// 	(function() {
// 		var messages = $('messages');
// 		if(messages)
// 			new Fx.Slide(messages, {duration: 500}).slideOut();
// 	}).delay(10000);
// 	event.stop();
// }.bindWithEvent());


Element.extend({

	/*
	Property: setValue
		Sets the value of the Element, if its tag is textarea, select or input. setValue called on a multiple select will set an array.
	*/

	setValue: function(value){
		switch(this.getTag()){
			case 'select':
				var values = (this.multiple) ? value : [value];
				$each(this.options, function(option, index){
					option.selected = values.contains($pick(option.value, option.text))
				});
				break;
			case 'input':
				if(['checkbox', 'radio'].contains(this.type)) {
					this.checked = (value == true);
				} else if(['hidden', 'text', 'password'].contains(this.type)) {
					this.value = value;
				}
				break;
			case 'textarea':
				this.value = value;
				break;
		}
	},
	
	/*
	Property: clearOptions
		Removes all <options> from a <select>.  Doesn't behave if <optiongroup>s are present.
	*/

	clearOptions: function() {
		while(this.options.length) 
			this.options[0] = null;
	},
	
	/*
	Property: addOption
		Adds an option to a <select>.
	*/

	addOption: function(name, value, isSelected) {
		var index = this.options.length;
		this.options[this.options.length] = new Option(name, value);
		if(isSelected)
			this.selectedIndex = index;
	},

	/*
	Property: addEventIfNotPresent
		Attaches an event listener to a DOM element, if it is not already
		attached to the given event.
	*/
	
	addEventIfNotPresent: function(type, fn) {
		this.removeEvent(type, fn);
		this.addEvent(type, fn);
	},

	/*
	Property: getAncestor
		Retrieves the ancestor for which the function returns True, if any.
	*/
	getAncestor: function(testfunc) {
		var node = $(this.getParent());
		while(node && !testfunc(node)) {
			node = $(node.getParent());
		}
		if(node && testfunc(node))
			return node;
		else
			return null;
	},

	/*
	Property: getPreviousMatching
		Retrieves the previous sibling node for which the function returns True, if any.
	*/
	getPreviousMatching: function(testfunc) {
		var node = $(this.getPrevious());
		while(node && !testfunc(node)) {
			node = $(node.getPrevious());
		}
		return node;
	},

	/*
	Property: getNextMatching
		Retrieves the next sibling node for which the function returns True, if any.
	*/
	getNextMatching: function(testfunc) {
		var node = $(this.getNext());
		while(node && !testfunc(node)) {
			node = $(node.getNext());
		}
		return node;
	}
});


var ScrolledSortables = Sortables.extend({
	initialize: function(list, options){
		this.parent(list, options);
		if(!this.options.scrollContainers)
			this.options.scrollContainers = null;
	},

	start: function(event, el){
		this.active = el;
		this.coordinates = this.list.getCoordinates(this.options.scrollContainers);
		if (this.options.ghost){
			var position = el.getPosition(this.options.scrollContainers);
			this.offset = event.page.y - position.y;
			this.trash = new Element('div').inject(document.body);
			this.ghost = el.clone().inject(this.trash).setStyles({
				'position': 'absolute',
				'left': position.x,
				'top': event.page.y - this.offset
			});
			document.addListener('mousemove', this.bound.moveGhost);
			this.fireEvent('onDragStart', [el, this.ghost]);
		}
		document.addListener('mousemove', this.bound.move);
		document.addListener('mouseup', this.bound.end);
		this.fireEvent('onStart', el);
		event.stop();
	},

	move: function(event){
		var now = event.page.y;
		this.previous = this.previous || now;
		var up = ((this.previous - now) > 0);
		var prev = this.active.getPrevious();
		while (prev && up && now < prev.getCoordinates(this.options.scrollContainers).bottom) {
			this.active.injectBefore(prev);
			prev = this.active.getPrevious();
		}
		var next = this.active.getNext();
		while (next && !up && now > next.getCoordinates(this.options.scrollContainers).top) {
			this.active.injectAfter(next);
			next = this.active.getNext();
		}
		this.previous = now;
	}

});


/* Slugs are gastropod mollusks without shells or with very small internal
   shells */

Slug = new Class({
	slugify: function(s, num_chars) {
		removelist = ["a", "an", "as", "at", "before", "but", "by", "for",
						"from", "is", "in", "into", "like", "of", "off", "on",
						"onto", "per", "since", "than", "the", "this", "that",
						"to", "up", "via", "with"];
		r = new RegExp('\\b(' + removelist.join('|') + ')\\b', 'gi');
		s = s.replace(r, '');
		s = s.replace(/[^-\w\s]/g, '');		// remove unneeded chars
		s = s.replace(/^\s+|\s+$/g, '');	// trim leading/trailing spaces
		s = s.replace(/[-\s]+/g, '-');		// convert spaces to hyphens
		s = s.toLowerCase();				// convert to lowercase
		return s.substring(0, num_chars);	// trim to first num_chars chars
	},

	initialize: function(slug, stud) {
		// slug: an id of a slug field
		// stud: the field that populates the slug
		this.slug = slug;
		this.stud = stud;
		this.eventSet = false;

		this.studChangeHandler = function() {
			var maxlength = $(this.slug).maxlength || 50;
			var value = this.slugify($(this.stud).getValue(), maxlength);
			$(this.slug).setValue(value);
		}.bind(this);

		this.slugChangeHandler = function() {
			if($(this.slug).getValue() == "") {
				if(!this.eventSet)
					$(this.stud).addEvent('keyup', this.studChangeHandler);
				this.eventSet = true;
			} else {
				if(this.eventSet)
					$(this.stud).removeEvent('keyup', this.studChangeHandler);
				this.eventSet = false;
			}
		}.bind(this);

		if($(stud) && $(slug)) {
			$(slug).addEvent('keyup', this.slugChangeHandler);
			$(slug).fireEvent('keyup');
		}
	}
});


//---- File upload API ------------------------------------------------------

FileUploadDialog = new Class({
	initialize: function(onSuccess, onCancel, options) {
		this.onSuccess = onSuccess || function(response){};
		this.onCancel = onCancel || function(response){};
		if(options)
			var optionsQueryString = Object.toQueryString(options);
		else
			var optionsQueryString = '';
		
		new ModalDialog({
			buttons: [
				['Upload', function(dialog) {
						$E('form', dialog.content).submit();
						return true;
					}.bind(this)],
				['Cancel', this.onCancel]
				],
			url: "/admin/upload_api/dialog/?" + optionsQueryString,
			evalScripts: true,
			loaderFailureMessage: '<p><strong>File upload API failed.</strong></p><p>Please inform the site administrator.</p>',
			onClose: this.uploadDialogClose.bind(this)
			});
	},
	uploadDialogClose: function(dialog) {
		var responseField = $('upload_dialog_response', dialog.content);
		if(responseField && responseField.value) {
			var output = Json.evaluate(responseField.value);
			if(output.filename) {
				markDirty();
				this.onSuccess(output);
				return;
			}
		}
		this.onCancel();
	}
});

UploadWidget = new Class({
	initialize: function(fieldElement) {
		this.fieldElement = fieldElement;

		$E('input.uploadButton', this.fieldElement).addEvent("click", this.uploadButtonClick.bindWithEvent(this));
		var clearButton = $E('input.clearButton', this.fieldElement);
		if(clearButton)
			clearButton.addEvent("click", this.clearButtonClick.bindWithEvent(this));

		this.updateDisplay();
	},
	updateDisplay: function() {
		var value = this.getValue();
		$E('.uploadFilename', this.fieldElement).setText(value.source_filename || '(no file)');
		var link = $E('.uploadLink', this.fieldElement);
		if(value.url)
			link.setProperty('href', value.url);
		else
			link.removeProperty('href');
	},
	getValue: function() {
		return Json.evaluate($E('input.uploadResponse', this.fieldElement).value);
	},
	setValue: function(value) {
		$E('input.uploadResponse', this.fieldElement).value = Json.toString(value);
	},
	getOptions: function() {
		return Json.evaluate($E('input.uploadOptions', this.fieldElement).value);
	},
	clearErrors: function() {
		var wrapper = this.fieldElement.getParent();
		wrapper.removeClass('field_errors');
		$ES('ul.errorlist', wrapper).each(function(el) {
			el.remove();
		});
	},

	uploadButtonClick: function(event) {
		var onSuccess = (function(output) {
			this.setValue(output);
			this.clearErrors();
			this.updateDisplay();
		}).bind(this);
		new FileUploadDialog(onSuccess, null, this.getOptions());
	},
	clearButtonClick: function(event) {
		this.setValue({});
		this.clearErrors();
		this.updateDisplay();
	}
});

UploadImageWidget = UploadWidget.extend({
	updateDisplay: function() {
		this.parent();
		var value = this.getValue();
		if(value.thumbnail_url)
			var thumbnail_url = value.thumbnail_url;
		else
			var thumbnail_url = '/admin/upload_api/thumbnail/' + (value.url || '') + '/';
		$E('.uploadImage', this.fieldElement).setProperty('src', thumbnail_url);
	}
});

window.addEvent('domready', function() {
	$ES('.upload_widget').each(function(el) {
		new UploadWidget(el);
	});
	$ES('.upload_image_widget').each(function(el) {
		new UploadImageWidget(el);
	});
});
