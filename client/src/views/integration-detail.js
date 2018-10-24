import { PolymerElement, html } from '@polymer/polymer';
import '@vaadin/vaadin-button/vaadin-button.js';
import '@vaadin/vaadin-tabs/vaadin-tabs.js';
import '@polymer/iron-pages';
import '@vaadin/vaadin-ordered-layout/vaadin-horizontal-layout';
import '@vaadin/vaadin-ordered-layout/vaadin-vertical-layout';
import '@vaadin/vaadin-text-field/vaadin-text-field';


class IntegrationDetail extends PolymerElement {

  static get properties() {
    return {
      page: String,
      basic: Object,
      lz: Object,
      sftp: Object,
      db: Object,
      stream: Object,
      gateway: Object,
      integration_id: String
    };
  }

  static get template() {

    return html`
            <style>
                page {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                     }
                
                .block {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 60em;
                      }
            </style> 
            
            <iron-ajax id="ajaxBasic" url="/api/integration/read/integration_basic" handle-as="json" last-response="{{basic}}"></iron-ajax>
            <iron-ajax id="ajaxKeys" url="/api/index/read/key_list" handle-as="json" last-response="{{keys}}"></iron-ajax>
            <iron-ajax id="ajaxPayload" url="/api/index/read/payload_list" handle-as="json" last-response="{{payload}}"></iron-ajax>
            
            <vaadin-dialog id="dialog" no-close-on-esc no-close-on-outside-click>
            <template>
                <div style="width:1600px;height:800px">
                    <vaadin-tabs selected="{{page}}">
                        <vaadin-tab>Basic</vaadin-tab>
                        <vaadin-tab>Landing Zone</vaadin-tab>
                        <vaadin-tab>SFTP</vaadin-tab>
                        <vaadin-tab>Database</vaadin-tab>
                        <vaadin-tab>Stream</vaadin-tab>
                        <vaadin-tab>Gateway</vaadin-tab>
                    </vaadin-tabs>
              
                    <iron-pages selected="[[page]]">
                        <page>
                            <vaadin-vertical-layout style="height: 700px">
                                <vaadin-text-field class="block" label="Title" value="[[basic.title]]"></vaadin-text-field>
                                <vaadin-text-field class="block" label="Description" value="[[basic.description]]"></vaadin-text-field>
                                <vaadin-text-field class="block" label="Default Type" value="[[basic.defaultType]]"></vaadin-text-field>
                                <vaadin-text-field class="block" label="Primary Service" value="[[basic.primaryService]]"></vaadin-text-field>
                                <vaadin-text-field class="block" label="Backup Service" value="[[basic.backupService]]"></vaadin-text-field>
                                <vaadin-text-field class="block" label="Output File" value="[[basic.outputFileId]]"></vaadin-text-field>
                            </vaadin-vertical-layout>
                        </page>
                        <page>
                        </page>
                        <page>
                        </page>
                    </iron-pages>
                      
              
                    <br>
                    <vaadin-button on-click="close">Ok</vaadin-button>
                    <vaadin-button on-click="close">Cancel</vaadin-button>
                </div>
            </template>
            </vaadin-dialog>
        `;

  }


  open(integration_id) {
    this.$.dialog.opened = true;
    this.integration_id = integration_id;

    this.$.ajaxBasic.set('params', { "integration_id": this.integration_id });
    this.$.ajaxBasic.generateRequest();

    // this.$.ajaxPayload.set('params', { "index_id": this.index_id });
    // this.$.ajaxPayload.generateRequest();

    // this.$.ajaxBasic.set('params', { "index_id": this.index_id });
    // this.$.ajaxBasic.generateRequest();

    this.page = "0";

  }

  close() {
    this.$.dialog.opened = false;
  }
}

window.customElements.define('integration-detail', IntegrationDetail);