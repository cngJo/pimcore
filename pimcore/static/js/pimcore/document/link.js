/**
 * Pimcore
 *
 * LICENSE
 *
 * This source file is subject to the new BSD license that is bundled
 * with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.pimcore.org/license
 *
 * @copyright  Copyright (c) 2009-2010 elements.at New Media Solutions GmbH (http://www.elements.at)
 * @license    http://www.pimcore.org/license     New BSD License
 */

pimcore.registerNS("pimcore.document.link");
pimcore.document.link = Class.create(pimcore.document.document, {

    type: "link",

    initialize: function(id) {

        pimcore.plugin.broker.fireEvent("preOpenDocument", this, "link");

        this.addLoadingPanel();
        this.id = parseInt(id);
        this.getData();
    },

    init: function () {
        if (this.isAllowed("properties")) {
            this.properties = new pimcore.document.properties(this, "document");
        }
        if (this.isAllowed("permissions")) {
            this.permissions = new pimcore.document.permissions(this);
        }
        this.dependencies = new pimcore.settings.dependencies(this, "document");
    },

    getSaveData : function () {
        var parameters = {};

        parameters.id = this.id;
        var values = this.panel.getForm().getFieldValues();
        values.published = this.data.published;
        parameters.data = Ext.encode(values);

        if (this.isAllowed("properties")) {
            // properties
            try {
                parameters.properties = Ext.encode(this.properties.getValues());
            }
            catch (e) {
                //console.log(e);
            }
        }

        return parameters;
    },

    addTab: function () {

        var tabTitle = this.data.key;
        this.tabPanel = Ext.getCmp("pimcore_panel_tabs");
        var tabId = "document_" + this.id;
        this.tab = new Ext.Panel({
            id: tabId,
            title: tabTitle,
            closable:true,
            layout: "border",
            items: [
                this.getLayoutToolbar(),
                this.getTabPanel()
            ],
            iconCls: "pimcore_icon_" + this.data.type,
            document: this
        });

        this.tab.on("beforedestroy", function () {
            Ext.Ajax.request({
                url: "/admin/misc/unlock-element",
                params: {
                    id: this.data.id,
                    type: "document"
                }
            });
        }.bind(this));

        // remove this instance when the panel is closed
        this.tab.on("destroy", function () {
            pimcore.globalmanager.remove("document_" + this.id);
        }.bind(this));

        this.tab.on("activate", function () {
            this.tab.doLayout();
            pimcore.layout.refresh();
        }.bind(this));

        this.tab.on("afterrender", function (tabId) {
            this.tabPanel.activate(tabId);
            pimcore.plugin.broker.fireEvent("postOpenDocument", this, "link");
        }.bind(this, tabId));

        this.removeLoadingPanel();

        this.tabPanel.add(this.tab);

        // recalculate the layout
        pimcore.layout.refresh();
    },

    getLayoutToolbar : function () {

        if (!this.toolbar) {

            this.toolbarButtons = {};

            this.toolbarButtons.publish = new Ext.Button({
                text: t('save_and_publish'),
                iconCls: "pimcore_icon_publish_medium",
                scale: "medium",
                handler: this.publish.bind(this)
            });


            this.toolbarButtons.unpublish = new Ext.Button({
                text: t('unpublish'),
                iconCls: "pimcore_icon_unpublish_medium",
                scale: "medium",
                handler: this.unpublish.bind(this)
            });

            /*this.toolbarButtons.remove = new Ext.Button({
             text: t('delete'),
             iconCls: "pimcore_icon_delete_medium",
             scale: "medium",
             handler: this.remove.bind(this)
             });*/


            var buttons = [];

            if (this.isAllowed("publish")) {
                buttons.push(this.toolbarButtons.publish);
            }
            if (this.isAllowed("unpublish")) {
                buttons.push(this.toolbarButtons.unpublish);
            }
            /*if(this.isAllowed("delete")) {
             buttons.push(this.toolbarButtons.remove);
             }*/

            this.toolbar = new Ext.Toolbar({
                id: "document_toolbar_" + this.id,
                region: "north",
                border: false,
                cls: "document_toolbar",
                items: buttons
            });

            this.toolbar.on("afterrender", function () {
                window.setTimeout(function () {
                    // it's not possible to delete the root-node
                    if (this.id == 1) {
                        this.toolbarButtons.remove.hide();
                    }

                    if (!this.data.published) {
                        this.toolbarButtons.unpublish.hide();
                    }
                }.bind(this), 500);
            }.bind(this));
        }

        return this.toolbar;
    },

    getTabPanel: function () {

        var items = [];

        items.push(this.getLayoutForm());

        if (this.isAllowed("properties")) {
            items.push(this.properties.getLayout());
        }
        if (this.isAllowed("permissions")) {
            items.push(this.permissions.getLayout());
        }
        items.push(this.dependencies.getLayout());
        
        this.tabbar = new Ext.TabPanel({
            tabPosition: "top",
            region:'center',
            deferredRender:false,
            enableTabScroll:true,
            border: false,
            items: items,
            activeTab: 0
        });

        return this.tabbar;
    },

    getLayoutForm: function () {

        if (!this.panel) {

            var path = "";
            if (this.data.href) {
                path = this.data.href;
            }

            var pathField = new Ext.form.TextField({
                name: "path",
                fieldLabel: t("path"),
                value: path
            });

            pathField.on("render", function (el) {
                var dd = new Ext.dd.DropZone(el.getEl().dom.parentNode.parentNode, {
                    ddGroup: "element",

                    getTargetFromEvent: function(e) {
                        return this.getEl();
                    },

                    onNodeOver : function(target, dd, e, data) {
                        return Ext.dd.DropZone.prototype.dropAllowed;
                    },

                    onNodeDrop : function(target, dd, e, data) {
                        this.setValue(data.node.attributes.path);
                        return true;
                    }.bind(this)
                });
            });

            this.panel = new Ext.form.FormPanel({
                title: t('link_properties'),
                collapsible: true,
                autoHeight:true,
                layout: "pimcoreform",
                labelWidth: 200,
                defaultType: 'textfield',
                defaults: {width:500},
                bodyStyle:'padding:10px;',
                region: "center",
                items :[
                    {
                                xtype: "compositefield",
                                items:  [{
                                        fieldLabel: t('name_navigation'),
                                        name: "name",
                                        value: this.data.name,
                                        xtype: "textfield",
                                        width: 367
                                    },
                                    {
                                        xtype: "button",
                                        text: t('further_navigation_settings'),
                                        disabled: !this.isAllowed("properties"),
                                        handler: function(){
                                               this.tabbar.activate(this.properties.getLayout());
                                        }.bind(this)
                                    }]
                            },
                    pathField,
                    new Ext.Spacer({
                        height: 50
                    })/*,
                    {
                        xtype: "combo",
                        fieldLabel: t('target'),
                        name: 'target',
                        triggerAction: 'all',
                        editable: true,
                        valueField: "value",
                        displayField: "label",
                        store: ["","_blank","_self","_top","_parent"],
                        value: this.data.target
                    },
                    {
                        fieldLabel: t('parameters'),
                        name: "parameters",
                        value: this.data.parameters
                    },
                    {
                        fieldLabel: t('anchor'),
                        name: "anchor",
                        value: this.data.anchor
                    },
                    {
                        fieldLabel: t('title'),
                        name: "title",
                        value: this.data.title
                    },
                    {
                        fieldLabel: t('accesskey'),
                        name: "accesskey",
                        value: this.data.accesskey
                    },
                    {
                        fieldLabel: t('relation'),
                        name: "rel",
                        value: this.data.rel
                    },
                    {
                        fieldLabel: t('tabindex'),
                        name: "tabindex",
                        value: this.data.tabindex
                    } */
                ]
            });
        }

        return this.panel;
    }
});

