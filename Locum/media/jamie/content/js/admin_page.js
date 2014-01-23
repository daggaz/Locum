window.addEvent('domready', function() {
	if($('preview')) {
		$('preview').addEvent('click', function(event) {
			try {
				event = new Event(event);

				tinyMCE.triggerSave();
		
				var copy = $('id_content_form_-copy').getValue();
				var template = $('id_page_form_-template').getValue();

				if(typeof(previewWindow) == "undefined" || previewWindow.closed) {
				 	previewWindow = window.open("", "previewWindow");
				}

				var form = new Element('form', {
					'id': 'previewForm',
					'action': this.getProperty('href'),
					'method': 'post',
					'target': 'previewWindow',
					'styles': {
						'display': 'none'
					}
				});
	
				form.adopt(
					new Element('input', {
						'name': 'preview',
						'type': 'hidden',
						'value': 'yes'
					}),
					new Element('input', {
						'name': 'copy',
						'type': 'hidden',
						'value': copy
					}),
					new Element('input', {
						'name': 'template',
						'type': 'hidden',
						'value': template
					})
				);
			
				var container = new Element('div').adopt(form);
				container.injectInside(document.body);

				form.submit();
			
				(function() {
					previewWindow.focus();
					this.remove();
				}).delay(500, form);
			} finally {
				event.preventDefault();
			}
		});
	}
});
