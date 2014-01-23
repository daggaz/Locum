SmoothSwap = new Class({
	initialize: function(first, second) {
		distance = second.offsetTop - first.offsetTop;
		first.style.top = -distance + "px";
		second.style.top = distance + "px";
		first.injectAfter(second);
		new Fx.Style(first, 'top').start(-distance, 0);
		new Fx.Style(second, 'top').start(distance, 0);
	}
});

UploadImageDialog = new Class({
	initialize: function(onSuccess, onCancel, extra_settings) {
		this.onSuccess = onSuccess || function(response){};
		this.onCancel = onCancel || function(response){};
		var queryString = Object.toQueryString({
			'json': Json.toString(extra_settings)
			});
		new ModalDialog({
			buttons: [
				['Upload', function(dialog) {
						$E('form', dialog.content).submit();
						return true;
					}.bind(this)],
				['Cancel', this.onCancel]
				],
			url: "/content_image_api/upload_dialog/?" + queryString,
			width: 'auto',
			height: 'auto',
			evalScripts: true,
			loaderFailureMessage: '<p><strong>Image upload API not found.</strong></p><p>Please inform the site administrator.</p>',
			onClose: this.uploadDialogClose.bind(this)
			});
	},
	uploadDialogClose: function(dialog) {
		// Assume all the inputs are checkboxes
		if($('upload_dialog_json')) {
			var json = $('upload_dialog_json').value;
			if(json) {
				markDirty();
				this.onSuccess(json);
				return;
			}
		}
		this.onCancel();
	}
});

ImageManager = new Class({
	initialize: function(parentSelector) {
        this.selector = parentSelector;
	},
	updateFormIndex: function(container, index) {
        var updateAttribute = function(el, attribute, regex, replacement) {
			var value = el[attribute].toString();
			value = value.replace(regex, replacement);
			el[attribute] = value;
		};

		// TODO -- the behaviour of replace here (replacing "$199" with "xxx99")
		// is implementation-defined -- it could in theory be interpreted as
		// "$19" and turned into nothing, yielding "9".

		container.getElementsBySelector('div.image').each(function(div) {
			div.getFormElements().each(function(el, i) {
				// Don't clear the 'force*' and 'max*' fields.
				if(i != 5 && i != 6 && i != 7 && i != 8)
					el.setValue('');
			});
		});
		container.getFormElements().each(function(el, i) {
			updateAttribute(el, 'name', /(img_)(\d+)/, '$1' + index.toString());
		});
		container.getElementsBySelector("[id]").each(function(el) {
			updateAttribute(el, 'id', /(img_)(\d+)/, '$1' + index.toString());
		});
		container.getElementsBySelector("label[for]").each(function(el) {
			updateAttribute(el, 'htmlFor', /(img_)(\d+)/, '$1' + index.toString());
		});
	},
	updateDisplayIndices: function() {
		var index = 0;
		$(this.selector).getElementsBySelector("div.image_set").each(function(el) {
			var indexElement = $E('div.index', el);
			var removeInput = $E('div.handle div.checkbox_input input', el);
			if(!removeInput.checked) {
				indexElement.setText(index.toString());
				index++;
			} else {
				indexElement.setText('-');
			}
		});
	},
	addImage: function() {
		var parent = $(this.selector);
		var countField = $('image_count');
		var count = (parseInt(countField.value) || 0);
		countField.value = count + 1;
		var original = parent.getChildren().getLast();
		var copy = original.clone(true);
		// Update the names etc, setting the appropriate index
		this.updateFormIndex(copy, count);
		$E('input.sort_order', copy).setValue(count);
		$ES('div.image img', copy).each(function(el) {
			el.src = '/media/jamie/admin/img/pixel.png';
		});
		
		// Update the width x height to show the expected size
		$ES('div.image', copy).each(function(imageDiv) {
			var inputFields = $ES('input[type="hidden"]', imageDiv);
			var forceWidth = parseInt(inputFields[5].getValue());
			var forceHeight = parseInt(inputFields[6].getValue());
			var maxWidth = parseInt(inputFields[7].getValue());
			var maxHeight = parseInt(inputFields[8].getValue());
			var widthSpan = $E('span.width', imageDiv);
			var heightSpan = $E('span.height', imageDiv);
			
			if(forceWidth || maxWidth)
				widthSpan.setText(forceWidth || '< ' + maxWidth);
			else
				widthSpan.setText('—');

			if(forceHeight || maxHeight)
				heightSpan.setText(forceHeight || '< ' + maxHeight);
			else
				heightSpan.setText('—');
		});
		// And add it to the page
        parent.adopt(copy);
		this.updateDisplayIndices();
		this.updateEvents();
	},
	uploadButtonClick: function(event) {
		var image_divs = $ES('div.image', event.target.getParent().getParent());
		var image_data = {}
		var image_div_index = {}
		image_divs.each(function(div) {
			var fields = $ES('input[type="hidden"]', div);
			var name = fields[0].getValue();
			var path = fields[1].getValue();
			var url = fields[2].getValue();
			var width = parseInt(fields[3].getValue());
			var height = parseInt(fields[4].getValue());
			var forceWidth = parseInt(fields[5].getValue());
			var forceHeight = parseInt(fields[6].getValue());
			var maxWidth = parseInt(fields[7].getValue());
			var maxHeight = parseInt(fields[8].getValue());
			var matte = fields[9].getValue();
			
			image_data[name] = {
				'name': name,
				'path': path,
				'url': url,
				'width': width,
				'height': height,
				'forceWidth': forceWidth,
				'forceHeight': forceHeight,
				'maxWidth': maxWidth,
				'maxHeight': maxHeight,
				'matte': matte
			};
			
			image_div_index[name] = div;
		});
		
		
		var onSuccess = function(x) {
			var json = Json.evaluate($('upload_dialog_json').getValue());
			
			for(var name in json) {
				var div = image_div_index[name];
				if(div) {
					var data = json[name];
					var fields = $ES('input[type="hidden"]', div);

					fields[1].setValue(data.filename);
					fields[2].setValue(data.url);
					fields[3].setValue(data.width);
					fields[4].setValue(data.height);
			
					var img = $E('img', div);
					img.removeProperty('height');
					img.src = data.url;

					var widthSpan = $E('span.width', div);
					var heightSpan = $E('span.height', div);
					widthSpan.setText(data.width);
					heightSpan.setText(data.height);
				}
			}	
		};
		
		new UploadImageDialog(
			onSuccess,
			null,
			image_data
		);
	},
	moveUpButtonClick: function(event) {
		var imageDiv = event.target.getParent().getParent();
		if(previous = imageDiv.getPrevious()) {
			var thisSortOrderField = $E('input.sort_order', imageDiv);
			var otherSortOrderField = $E('input.sort_order', previous);
			var thisValue = thisSortOrderField.getValue();
			thisSortOrderField.setValue(otherSortOrderField.getValue())
			otherSortOrderField.setValue(thisValue);
			new SmoothSwap(previous, imageDiv);
			markDirty();
			this.updateDisplayIndices();
		}
	},
	moveDownButtonClick: function(event) {
		var imageDiv = event.target.getParent().getParent();
		if(next = imageDiv.getNext()) {
			var thisSortOrderField = $E('input.sort_order', imageDiv);
			var otherSortOrderField = $E('input.sort_order', next);
			var thisValue = thisSortOrderField.getValue();
			thisSortOrderField.setValue(otherSortOrderField.getValue())
			otherSortOrderField.setValue(thisValue);
			new SmoothSwap(imageDiv, next);
			markDirty();
			this.updateDisplayIndices();
		}
	},
	updateEvents: function() {
		var parent = $(this.selector);
		// Add events to each category dropdown
		parent.getElementsBySelector('input.uploadButton').each(function(button) {
			button.removeEvents('click');
			button.addEvent('click', this.uploadButtonClick.bindWithEvent(this));
		}, this);

		parent.getElementsBySelector('button.moveUpButton').each(function(button) {
			button.removeEvents('click');
			button.addEvent('click', this.moveUpButtonClick.bindWithEvent(this));
		}, this);

		parent.getElementsBySelector('button.moveDownButton').each(function(button) {
			button.removeEvents('click');
			button.addEvent('click', this.moveDownButtonClick.bindWithEvent(this));
		}, this);

		parent.getElementsBySelector('div.handle div.checkbox_input input').each(function(input) {
			input.removeEvents('click');
			input.addEvent('click', this.updateDisplayIndices.bind(this));
		}, this);
	}
});


window.addEvent('domready', function() {
	imgManager = new ImageManager('images_form');
	$('add_image').addEvent('click', imgManager.addImage.bind(imgManager));
	imgManager.updateEvents();
});