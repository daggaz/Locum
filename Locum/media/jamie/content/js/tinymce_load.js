if(typeof(content_tinymce_config) == "undefined")
	content_tinymce_config = {}

/* Content app rich text */
tinyMCE.init($extend({
	mode: "textareas",
	editor_selector: "content_rich_text",

	theme: "advanced",
	content_css: ResourceConstants.RESOURCES_CSS_URL,
	dialog_type: "modal",

	theme_advanced_toolbar_location: "top",
	theme_advanced_toolbar_align: "left",
	theme_advanced_buttons1: "undo,redo,separator,cut,copy,paste,pasteword,separator,bold,italic,separator,bullist,numlist,separator,link,unlink,separator,image,separator,acronym,cite,formatselect,code",
	theme_advanced_buttons2: "tablecontrols",
	theme_advanced_buttons3: "",
	theme_advanced_blockformats: "p,h1,h2,h3,h4,h5,h6,blockquote",

	auto_cleanup_word: true,
	convert_urls: false,
	relative_urls : true,
	plugins: "advimage,cleanup,paste,table,xhtmlxtras",
	advimage_styles: "Left=highlight;Right=default;Focus=focus",
	paste_auto_cleanup_on_paste: true,
	valid_elements: "a[class|href|id|name|rel|target|title],acronym[title]," +
		"b,blockquote[cite],br,caption,cite,div[class|id],dd,dl[class|id],dt," +
		"em,h1[class|id],h2[class|id],h3[class|id],h4[class|id],h5[class|id],h6[class|id]," +
		"i,img[align|alt|border|class|dir|height|hspace|id|lang|longdesc|onmouseout|onmouseover|src|style|title|usemap|vspace|width]," +
		"li,ol[class|id],p[class|id],q," +
		"span,strong,table[summary],tbody,td,tfoot,th,thead,tr,ul[class|id]"
}, content_tinymce_config));