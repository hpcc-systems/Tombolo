import { PolymerElement, html } from '@polymer/polymer';
import '@vaadin/vaadin-button/vaadin-button.js';
import '@vaadin/vaadin-tabs/vaadin-tabs.js';
import '@polymer/iron-pages';
import '@vaadin/vaadin-ordered-layout/vaadin-horizontal-layout';
import '@vaadin/vaadin-ordered-layout/vaadin-vertical-layout';
import '@vaadin/vaadin-text-field/vaadin-text-field';


class FileDetail extends PolymerElement {

  static get properties() {
    return {
      page: String,
      basic: Object,
      layout: Object,
      validations: Object,
      relations: Object,
      license: Object,
      file_id: String
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
            
            <iron-ajax id="ajaxBasic" url="/api/file/read/file_basic" handle-as="json" last-response="{{basic}}"></iron-ajax>
            <iron-ajax id="ajaxLayoutList" url="/api/file/read/layout_list" handle-as="json" last-response="{{layout}}"></iron-ajax>
            <iron-ajax id="ajaxValidationList" url="/api/file/read/validation_list" handle-as="json" last-response="{{validations}}"></iron-ajax>
            <iron-ajax id="ajaxRelationList" url="/api/file/read/relations_list" handle-as="json" last-response="{{relations}}"></iron-ajax>
            <iron-ajax id="ajaxLicenseList" url="/api/file/read/license_list" handle-as="json" last-response="{{license}}"></iron-ajax>
            
            <vaadin-dialog id="dialog" no-close-on-esc no-close-on-outside-click>
            <template>
                <div style="width:1600px;height:800px">
                    <vaadin-tabs selected="{{page}}">
                        <vaadin-tab>Basic</vaadin-tab>
                        <vaadin-tab>Layout</vaadin-tab>
                        <vaadin-tab>License</vaadin-tab>
                        <vaadin-tab>Parent Relation</vaadin-tab>
                        <vaadin-tab>Validation</vaadin-tab>
                    </vaadin-tabs>
              
                    <iron-pages selected="[[page]]">
                        <page>
                            <vaadin-vertical-layout style="height: 700px">
                                <vaadin-text-field class="block" label="Title" value="[[basic.title]]"></vaadin-text-field>
                                <vaadin-text-field class="block" label="Description" value="[[basic.description]]"></vaadin-text-field>
                                <vaadin-text-field class="block" label="Primary Service" value="[[basic.primaryService]]"></vaadin-text-field>
                                <vaadin-text-field class="block" label="Backup Service" value="[[basic.backupService]]"></vaadin-text-field>
                                <vaadin-text-field class="block" label="Path" value="[[basic.qualifiedPath]]"></vaadin-text-field>
                                <vaadin-text-field class="block" label="File Type" value="[[basic.fileType]]"></vaadin-text-field>
                                <vaadin-text-field class="block" label="Is Super File" value="[[basic.isSuperFile]]"></vaadin-text-field>
                            </vaadin-vertical-layout>
                        </page>
                        <page>
                            
                            <vaadin-grid style="height: 700px" aria-label="Basic Binding Example" items="[[layout]]">
              
                                  <vaadin-grid-column width="15em">
                                    <template class="header">Field Name</template>
                                    <template>[[item.name]]</template>
                                  </vaadin-grid-column>
                        
                                  <vaadin-grid-column>
                                    <template class="header">Data Type</template>
                                    <template>[[item.type]]</template>
                                  </vaadin-grid-column>
                            
                                  <vaadin-grid-column>
                                    <template class="header">Display Type</template>
                                    <template>[[item.displayType]]</template>
                                  </vaadin-grid-column>
                            
                                  <vaadin-grid-column >
                                    <template class="header">Display Size</template>
                                    <template>
                                      <div style="white-space: normal">[[item.displaySize]]</div>
                                    </template>
                                  </vaadin-grid-column>
                                  
                                  <vaadin-grid-column>
                                    <template class="header">Text Justification</template>
                                    <template>[[item.textJustification]]</template>
                                  </vaadin-grid-column>
                            
                                  <vaadin-grid-column>
                                    <template class="header">Format</template>
                                    <template>[[item.format]]</template>
                                  </vaadin-grid-column>
                            
                                  <vaadin-grid-column>
                                    <template class="header">Is SPII</template>
                                    <template>
                                      <div style="white-space: normal">[[item.isSPII]]</div>
                                    </template>
                                  </vaadin-grid-column>
                                  
                                  <vaadin-grid-column>
                                    <template class="header">Is PII</template>
                                    <template>
                                      <div style="white-space: normal">[[item.isPII]]</div>
                                    </template>
                                  </vaadin-grid-column>
                                  
                                              
                                  <vaadin-grid-column width="14em">
                                  <template>
                                    <div style="text-align: right;">
                                      <vaadin-button id="edit-button" on-click="openDialog" theme="icon" aria-label="Edit">Edit</vaadin-button>
                                    </div>
                                  </template>
                                  </vaadin-grid-column>
                        
                            </vaadin-grid>
                       </page>
                        
                       <page>
                            <vaadin-grid aria-label="Tree Data Grid Example" items="[[license]]">
                        
                                 <vaadin-grid-column width="15em">
                                    <template class="header">Name</template>
                                    <template><a href="[[item.url]]" target="_blank">[[item.name]]</a></template>
                                  </vaadin-grid-column>                        
                         
                            </vaadin-grid>
                        </page>

                        <page>
                            <vaadin-grid aria-label="Tree Data Grid Example" items="[[relations]]">
                        
                                 <vaadin-grid-column width="15em">
                                    <template class="header">Source</template>
                                    <template>[[item.sourceFileId]]</template>
                                  </vaadin-grid-column>
                        
                                  <vaadin-grid-column>
                                    <template class="header">Source Field</template>
                                    <template>[[item.sourceField]]</template>
                                  </vaadin-grid-column>
                            
                                  <vaadin-grid-column width="15em">
                                    <template class="header" >Destination Field</template>
                                    <template>[[item.destinationField]]</template>
                                  </vaadin-grid-column>
                         
                            </vaadin-grid>
                        </page>
                        <page>
                            <vaadin-grid style="height: 700px" aria-label="Basic Binding Example" items="[[validations]]">
              
                                  <vaadin-grid-column width="15em">
                                    <template class="header">Name</template>
                                    <template>[[item.name]]</template>
                                  </vaadin-grid-column>
                        
                                  <vaadin-grid-column>
                                    <template class="header">Rule Type</template>
                                    <template>[[item.ruleType]]</template>
                                  </vaadin-grid-column>
                            
                                  <vaadin-grid-column width="15em">
                                    <template class="header" >Rule</template>
                                    <template>[[item.rule]]</template>
                                  </vaadin-grid-column>
                            
                                  <vaadin-grid-column >
                                    <template class="header">Action</template>
                                    <template>
                                      <div style="white-space: normal">[[item.action]]</div>
                                    </template>
                                  </vaadin-grid-column>
                                  
                                  <vaadin-grid-column width="15em">
                                    <template class="header">Fix Script</template>
                                    <template>[[item.fixScript]]</template>
                                  </vaadin-grid-column>
                                              
                                  <vaadin-grid-column width="10em">
                                  <template>
                                    <div style="text-align: right;">
                                      <vaadin-button id="edit-button" on-click="openDialog" theme="icon" aria-label="Edit">Edit</vaadin-button>
                                    </div>
                                  </template>
                                  </vaadin-grid-column>
                                  
                        
                            </vaadin-grid>

                        
                        </page>
                        <page></page>
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


  open(file_id) {
    this.$.dialog.opened = true;
    this.file_id = file_id;

    this.$.ajaxLayoutList.set('params', { "file_id": this.file_id });
    this.$.ajaxLayoutList.generateRequest();

    this.$.ajaxValidationList.set('params', { "file_id": this.file_id });
    this.$.ajaxValidationList.generateRequest();

    this.$.ajaxRelationList.set('params', { "file_id": this.file_id });
    this.$.ajaxRelationList.generateRequest();

    this.$.ajaxLicenseList.set('params', { "file_id": this.file_id });
    this.$.ajaxLicenseList.generateRequest();

    this.$.ajaxBasic.set('params', { "file_id": this.file_id });
    this.$.ajaxBasic.generateRequest();

    this.page = "0";

  }

  close() {
    this.$.dialog.opened = false;
  }
}

window.customElements.define('file-detail', FileDetail);