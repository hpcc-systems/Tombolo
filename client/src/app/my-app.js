import { PolymerElement, html } from '@polymer/polymer';
import { setPassiveTouchGestures, setRootPath } from '@polymer/polymer/lib/utils/settings';
import '@polymer/app-layout/app-drawer/app-drawer';
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout';
import '@polymer/app-layout/app-header/app-header';
import '@polymer/app-layout/app-header-layout/app-header-layout';
import '@polymer/app-layout/app-scroll-effects/app-scroll-effects';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import '@polymer/app-route/app-location';
import '@polymer/app-route/app-route';
import '@polymer/iron-pages';
import '@polymer/iron-selector/iron-selector';
import '@polymer/paper-icon-button';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu';
import '@vaadin/vaadin-dropdown-menu';
import '@vaadin/vaadin-ordered-layout/vaadin-horizontal-layout';
import {Comm} from  '../js/Comm.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import '@vaadin/vaadin-button/vaadin-button.js';

//The lists
import '../views/file-list.js';
import '../views/index-list.js';
import '../views/integration-list.js';

import '../icons/my-icons.js'; 

setPassiveTouchGestures(true);

setRootPath(MyAppGlobals.rootPath);

class MyApp extends PolymerElement {


    static get template() {
        return html`
      <style>
        :host {
          --app-primary-color: #4285f4;
          --app-secondary-color: black;

          display: block;
        }

        app-drawer-layout:not([narrow]) [drawer-toggle] {
          display: none;
          
        }

        app-drawer {
          --app-drawer-content-container: {
            
            background-color: #404040;
          }
          --app-drawer-scrim-background: rgba(179, 157, 219, 0.5);
        }
        
        app-drawer-layout {
          background-color: lightgray;
        }

        app-header {
          color: black;
          background-color: #fff
        }

        app-header paper-icon-button {
          --paper-icon-button-ink-color: white;
        }

        .drawer-list {
          margin: 0 20px;
          
        }

        .drawer-list a {
          display: block;
          padding: 0 16px;
          text-decoration: none;
          color: #bfbf92;
          font-weight:500;
          font-size: 16px;
          line-height: 40px;
          
          
        }

        .drawer-list a.iron-selected {
          color: #bfbf92;   
          font-weight:500;
          font-size: 16px;
          background-color: gray;
        }
        
 
      </style>  
      
      
      <iron-ajax auto url="/api/app/read/app_list" handle-as="json" last-response="{{app_data}}"></iron-ajax>
      
      <app-location route="{{route}}" url-space-regex="^[[rootPath]]">
      </app-location>

      <app-route route="{{route}}" pattern="[[rootPath]]:page" data="{{routeData}}" tail="{{subroute}}">
      </app-route>

      <app-drawer-layout fullbleed narrow="{{narrow}}">
        <!-- Drawer content -->
        <app-drawer  id="drawer"  slot="drawer" swipe-open="[[narrow]]">
          <app-toolbar style="background-color:gray; color:#ff5722">

               <h3>Tombolo</h3>

          </app-toolbar>

          <template is="dom-if" if="{{application_id}}">

            <iron-selector selected="[[page]]" 
                          attr-for-selected="name" class="drawer-list" 
                          role="navigation" fallback-selection="0">

                  <a name="files" href="[[rootPath]]files">File</a>
                  <a name="indexes" href="[[rootPath]]indexes">Index</a>
                  <a name="jobs" href="[[rootPath]]jobs">Job</a>
                  <a name="queries" href="[[rootPath]]queries">Query</a>
                  <a name="cubes" href="[[rootPath]]cubes">Cube</a>
              
            </iron-selector>
            
    
          </template>

        </app-drawer>

        <!-- <a name="integrations" href="[[rootPath]]integrations">Integration</a>
        <a name="workflow" href="[[rootPath]]workflows">Workflow</a> -->

        <!-- Main content -->
        <app-header-layout has-scrolling-region="">

          <app-header slot="header" condenses="" reveals="" effects="waterfall">
            <app-toolbar>
                <vaadin-horizontal-layout theme="spacing">
                    <vaadin-dropdown-menu id="application"  value-changed="_selectedMenu" >
                      <template>
                        <vaadin-list-box>
                          <vaadin-item value disabled>Select an Application</vaadin-item>
                          <template is="dom-repeat" items="{{app_data}}">
                              <vaadin-item  on-click="_selectedMenu" id="{{item._id}}" value="{{item._id}}">{{item.title}}</vaadin-item> 
                          </template>
                        </vaadin-list-box>
                      </template>
                    </vaadin-dropdown-menu>
                    <template is="dom-if" if="{{application_id}}">
                        <vaadin-button class="block" on-click="">Export to VSCode</vaadin-button>
                    </template>
                </vaadin-horizontal-layout>
            </app-toolbar>  
            
          </app-header>

          <iron-pages id="pages" selected="[[page]]" attr-for-selected="name" selected-attribute="active" role="main">
                <file-list name="files" app_id="{{application_id}}"></file-list> 
                <index-list name="indexes" app_id="{{application_id}}"></index-list>
                <integration-list name="integrations" app_id="{{application_id}}"></integration-list>
          </iron-pages>
          
        </app-header-layout>
      </app-drawer-layout>
    `;
    }


    static get properties() {
        return {
            page: {
                type: String,
                reflectToAttribute: true,
                observer: '_pageChanged'
            },
            routeData: Object,
            subroute: Object,
            app_data: Object,
            nav_data: Object,
            application_id: String
        };
    }

    constructor() {
        super();
        this.application_id = null;
    }

    ready() {
        super.ready();

        //Comm.getData('app_list', '', 'app', this);
        window.history.pushState({}, null, '/');
        window.dispatchEvent(new CustomEvent('location-changed'));
    }

    _selectedMenu(e) {    
        this.page = null;
        this.application_id = e.target.id;
    }

    receiveData(respType, resp) {
        console.log('[my-app] app:');
        console.log(JSON.stringify(resp));

        this.app_data = resp;

        window.history.pushState({}, null, '/');
        window.dispatchEvent(new CustomEvent('location-changed'));
    }

    static get observers() {
        return [
            '_routePageChanged(routeData.page)'
        ];
    }

    _routePageChanged(page) {
        console.log('page changed - ' + page);
        this.page = page;

    }

    _pageChanged(page) {

        // if (page) {

        //   import('../views/list-view.js');

        // }
    }

}

window.customElements.define('my-app', MyApp);
