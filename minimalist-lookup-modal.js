; (function ($, window, document, undefined) {

    'use strict';

    var pluginName = 'lookupModal';
    var pluginCodeName = 'lookup.modal';
    var defaults = {
        listTitle: '',
        searchPlaceholder: '',
        containerClass: '',
        localStorage: false,
        ajaxUrl: '',
        ajaxRequestOnModalOpen: false,
        skipEmptySearch: false,
        onClickItemCallback: false,
        itemKey: '',
        displayItem: '',
        extraInputParam: {},
        callbackOnClickItem: function(modal, param) {}
    };

    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this.param = $.extend({}, {
            timeoutTyping: null,
            ajaxRequest: null
        });

        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {

            this._buildDialog();
            this._initOnKeyup();
            this._initOnShowModal();
            this._initOnHideModal();
            this._initOnClickItem();
            this._initOnClearHistory();
        },
        _buildInputHidden: function () {

            let keys = Object.keys(this.settings.extraInputParam);
            let extraInputParamStr = '';
            for (let i = 0; i < keys.length; i++) {
                extraInputParamStr += `<input type="hidden" name="${keys[i]}" value="${this.settings.extraInputParam[keys[i]]}">`;
            }

            return extraInputParamStr;
        },
        _buildDialog: function () {

            let dialog = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <input type="text" class="form-control" name="query" placeholder="${this.settings.searchPlaceholder}" autocomplete="off">
                            ${this._buildInputHidden()}
                        </div>
                        <div class="modal-body p-0">
                            <div class="result-info"></div>
                        </div>
                        <div class="modal-body text-sm py-2 text-muted">
                            ${this.settings.listTitle}
                        </div>
                        <div class="modal-body p-0">
                            <div class="list-group list-group-flush" style="max-height: 240px; overflow: auto;">
                                <a href="#" class="list-group-item list-group-item-action disabled">Searched data and history shown here</a>
                            </div>
                        </div>
                        <div class="modal-footer justify-content-between">
                            <div>
                                <span class="text-muted text-sm d-none loading">Searching...</span>
                            </div>
                            <div>
                                ${this.settings.localStorage !== false ? `<button class="btn btn-sm btn-outline-info clear-history">Clear History</button>` : ``}
                            </div>
                        </div>
                    </div>
                </div>`;

            $(this.element).html(dialog);
        },
        _getListContainer: function() {
            return $(this.element).find('.list-group');
        },
        _getSearch: function() {
            return $(this.element).find('input[name="query"]');
        },
        _getFooterLoading: function() {
            return $(this.element).find('.loading');
        },
        _toggleFooterLoading: function(show){
            if(show === true){
                this._getFooterLoading().removeClass('d-none');
            }else{
                this._getFooterLoading().addClass('d-none');
            }
        },
        _getResultInfo: function() {
            return $(this.element).find('.result-info');
        },
        _setResultInfo: function(html) {
            this._getResultInfo().html(html);
        },
        _appendClickHistory: function() {

            if (this.settings.localStorage !== false) {

                let existingElement = localStorage.getItem(this.settings.localStorage);
    
                if (existingElement && existingElement != '') {
                    this._getListContainer().html(existingElement);
                }
            }

        },
        _ajaxDialogSearch: function(query, formData) {
            
            let that = this;

            if (that.param.ajaxRequest != null) {
                that.param.ajaxRequest.abort();
            }
    
            that.param.ajaxRequest = $.ajax({
                url: that.settings.ajaxUrl,
                type: 'GET',
                dataType: 'json',
                data: formData,
                beforeSend: function () {
    
                },
                complete: function () {
                    that._toggleFooterLoading(false);
                    that.param.ajaxRequest = null;
                },
                success: function (json) {
                    if (json.data && json.data.length > 0) {
    
                        that._getListContainer().html('');
    
                        for (let i = 0; i < json.data.length; i++) {
    
                            if (that._getListContainer().find('[data-' + that.settings.itemKey + '="' + json.data[i][that.settings.itemKey] + '"').length < 1) {
    
                                let data_keys = Object.keys(json.data[i]);
                                let data_key_str = '';
                                let display_item = that.settings.displayItem;
    
                                for (let dk = 0; dk < data_keys.length; dk++) {
                                    display_item = display_item.replace('%' + data_keys[dk] + '%', json.data[i][data_keys[dk]]);
                                    data_key_str += 'data-' + data_keys[dk] + '="' + json.data[i][data_keys[dk]] + '" ';
                                }
    
                                that._getListContainer().append('<a href="#" ' + data_key_str + ' class="list-group-item list-group-item-action item-user">' + display_item + '</a>');
                            }
                        }
                    } else {
    
                        that._setResultInfo('<div class="alert alert-info mx-3 mt-2">Data ' + query + ' not exist</div>');
                    }
                },
                error: function () {
                    that._setResultInfo('<div class="alert alert-danger mx-3 mt-2">Something went wrong, please try again</div>');
                }
            });
        },
        _initOnKeyup: function () {

            let that = this;

            $(this.element).on('keyup', 'input[name="query"]', function () {

                let $input = $(this);
                let query = $input.val();

                if (that.param.timeoutTyping != null) {
                    clearTimeout(that.param.timeoutTyping);
                }

                that._toggleFooterLoading(true);
                that._setResultInfo('');

                if (query == '') {
                    that._appendClickHistory();
                }

                that.param.timeoutTyping = setTimeout(function () {

                    let $parent = $input.parent();
                    let formData = $parent.find(':input').serialize();

                    if (that.settings.skipEmptySearch === true) {

                        if (query != '') {
                            that._ajaxDialogSearch(query, formData);
                        } else {
                            that._toggleFooterLoading(false);
                        }

                    } else {

                        that._ajaxDialogSearch(query, formData);
                    }

                }, 1500);

            });

        },
        _initOnShowModal: function() {

            let that = this;

            $(this.element).on('show.bs.modal', function (e) {

                that._appendClickHistory();
        
                if (that.settings.ajaxRequestOnModalOpen === true) {

                    that._getSearch().val('');
                    that._getSearch().trigger('keyup');
                }
        
            });
        },
        _initOnHideModal: function() {

            let that = this;

            $(this.element).on('hide.bs.modal', function (e) {

                if (that.param.ajaxRequest != null) {
                    that.param.ajaxRequest.abort();
                }
        
            });
            
        },
        _initOnClickItem: function() {
            
            let that = this;

            $(this.element).on('click', '.item-user', function (e) {
                e.preventDefault();

                let $a = $(this);
                let data_key = $a.data(that.settings.itemKey);
                let data_attr = $a.data();
        
                if (that.settings.localStorage !== false) {
        
                    let existingElement = localStorage.getItem(that.settings.localStorage);
                    if (!existingElement) {
                        existingElement = '';
                    }
        
                    if (existingElement.indexOf(data_key) < 0) {
                        existingElement += $a.prop('outerHTML');
                        localStorage.setItem(that.settings.localStorage, existingElement);
                    }
                }
        
                that.settings.callbackOnClickItem(that, data_attr);
            });
        },
        _initOnClearHistory: function() {

            let that = this;

            $(this.element).on('click', '.clear-history', function (e) {
                e.preventDefault();
        
                that.clearList();
            });
        },
        clearInput: function() {

            $(this.element).find('input[type="text"], input[type="hidden"]').val('');
        },
        clearList: function () {

            if (this.settings.localStorage) {
                localStorage.setItem(this.settings.localStorage, '');
            }
    
            this._getListContainer().html('<a href="#" class="list-group-item list-group-item-action disabled">Searched data shown here</a>');
        },
        setParam: function(name, value) {
            $(this.element).find('input[name="'+name+'"]').val(value);
        },
        open: function () {
            $(this.element).modal('show');
        },
        close: function () {
            $(this.element).modal('hide');
        },
    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, pluginCodeName)) {
                $.data(this, pluginCodeName, new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);
