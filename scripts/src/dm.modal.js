dm.globalComponentFactory("modal", function(http, $) {
		
	//Initial Setup for modal. This is where the main DOM structure gets inserted into the page.
	var config = dm.config.modal;	
	var $body = $('body');
	
	var getModalTemplate = function () {
		if (config.modalTemplate !== undefined) {
			return config.modalTemplate
		} else {
			return http.get(config.modalTemplateUrl());
		}
	};
	
	var addModal = function(template) {			
		$body.append(template);
	};
	
	(function () {
		
		if (config.modalTemplate === undefined) {
			getModalTemplate().done(function (template) {
				addModal(template);	
			});	
		} else {
			addModal(config.modalTemplate());
		}								
	})();
	
	
	var modalDefaultOptions = {				
		content: "",
		closeOnEscape: true,
		closeOnOverlay: true
	};
	
	//Modal constructor and prototype definitions
	var Modal = function (options) {
		var defaults = modalDefaultOptions;
		var plugin = this;
		this.settings = jQuery.extend(true, {}, defaults, options);
		console.log(this.settings);
		if (typeof this.settings.content === "object") {
			if (this.settings.content.url !== undefined && this.settings.content.preload === true)
			{
				
				loadContent(this.settings.content.url).done(function (content) {
					plugin.content = content;
				});
			}
		} else if (typeof this.settings.content === "string") {
			this.content = this.settings.content;
		}
	};
	
	Modal.prototype.open = function () {
		if (this.content === undefined) {
			$('.dm-modal').addClass('loading');
			loadContent(this.settings.content.url).done(function (content) {
				insertContent(content);
				$('.dm-modal').removeClass('loading');		
			});
		} else {
			insertContent(this.content);
		}
		bindEvents.apply(this);
	};
	
	Modal.prototype.close = function () {
		close();
	};
	
	function close() {
		$('.dm-modal').removeClass('open').attr('aria-hidden', true);
		removeEvents();
	}
	
	function loadContent(url) {
		return http.get(url);
	}	
	
	function insertContent(content) {
		$('.dm-modal .dm-modal-body').empty();
		$('.dm-modal .dm-modal-body').html(content);
		$('.dm-modal').addClass('open').attr('aria-hidden', false);	
		
	}
	
	function bindEvents() {
		removeEvents();
		///EVENTS
		var $doc = $(document);
		var context = this;
		if (context.settings.closeOnOverlay) {
			$doc.on('click.dm-modal', '.dm-modal', function (e) {
				context.close();
			});	
			$doc.on('click.dm-modal-body', '.dm-modal-body', function (e) {
				e.preventDefault();
				e.stopPropagation();
			});
		}
		
		if (context.settings.closeOnEscape) {
			$doc.on('keyup.closeOnEscape', function (e) {
				if (e.keyCode === 27) {
					context.close();
				}
			});
		}	
	}
	
	function removeEvents() {
		var $doc = $(document);
		$doc.off('click.dm-modal');
		$doc.off('click.dm-modal-body');
		$doc.off('keyup.closeOnEscape');
	}
	
	
	//Factory for creating new modal instances
	var modalFactory = {
		create: function (options) {
			return new Modal(options);
		}
	};
	
	//Data api
	$(function() {		
		$('[data-dm-modal="true"]').each(function () {
			var $this = $(this);
			var options = {
				closeOnEscape: ($this.data('dm-modal-closeonescape') === undefined) ? true : $this.data('dm-modal-closeonescape'),
				closeOnOverlay: ($this.data('dm-modal-closeonoverlay') === undefined) ? true : $this.data('dm-modal-closeonoverlay')
			}
			
			if ($this.data('dm-modal-content-id') !== undefined) {
				options.content = $('#' + $this.data('dm-modal-content-id')).html();
			} else if ($this.data('dm-modal-content-url') !== undefined) {
				options.content = {
					url: $this.data('dm-modal-content-url'),
					preload: ($this.data('dm-modal-preload') === undefined) ? true : $this.data('dm-modal-preload')
				}
			}
			
			var settings = jQuery.extend(true, modalDefaultOptions, options);
			$this.data('dm-modal', modalFactory.create(settings))
			
			$this.on('click', function (e) {
				e.preventDefault();				
				var $this = $(this);
				$this.data('dm-modal').open();
			});
			
		});
		
		$(document).on('click', '[data-dm-modal-close="true"]', function () {
			close();
		});
	});
	return modalFactory;
	
}, {
	modalTemplate: undefined,
	modalTemplateUrl: function () {
		return dm.config.basePath + '/templates/modal.html'
	}
}, function (){
	return [dm.http, jQuery];
});