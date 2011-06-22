/**
 * TimeSide - Web Audio Components
 * Copyright (c) 2008-2009 Samalyse
 * Author: Olivier Guilyardi <olivier samalyse com>
 * License: GNU General Public License version 2.0
 */

TimeSide(function($N) {

    $N.Class.create("Controller", $N.Core, {

        initialize: function($super, cfg) {
            $super();
            this.configure(cfg, {
                player: null,
                soundProvider: null,
                map: null,
                divmarkers:[]
            });
            if (this.cfg.player && !$N.isInstanceOf(this.cfg.player, 'Player')) {
                this.cfg.player = new $N.Player(this.cfg.player);
            }
            this._setupPlayer();
            this.loadHTTP();
            
        },

        _setupPlayer: function() {
            this.debug('_setupPlayer');
            this.cfg.player
            .setMarkerMap(this.cfg.map)
            .observe('markeradd', this.attach(this._onMarkerAdd))
            //player markermove listens for changes of ruler markermove which listens
            //foir changes in each marker move
            .observe('markermove', this.attach(this._onMarkerMove))
            ._setupInterface();

            this.cfg.map.observe('add',this.attach(this._onMarkerMapAdd));
            this.cfg.map.observe('remove',this.attach(this._onMarkerMapRemove));
            this.cfg.map.observe('moved',this.attach(this._onMarkerMapMoved));
            
        },

        //called whenever a marker is moved in the ruler BUT NOT in the map
        _onMarkerMove: function(e, data) {
            if (this.cfg.map) {
                $N.Util.selectMarkerTab(); //defined in utils.js
                this.cfg.map.move(data.index, data.offset);
            //this will fire the method below
            }
        },

        _onMarkerMapMoved:function(e, data){
            var from = data.fromIndex;
            var to = data.toIndex;
            this.cfg.divmarkers.move(from,to); //new array method see application.js
            this.cfg.player.ruler.markers.move(from,to);
            this.updateIndices(from,data.newIndex);
            this.divFocus(data.newIndex);
        },

        divFocus: function(divIndex){
            if(this.cfg.divmarkers){
                var max = this.cfg.divmarkers.length;
                for (var i = 0; i < max; i++) {
                    if(i==divIndex){
                        this.cfg.divmarkers[i].focusOn();
                    }else{
                        this.cfg.divmarkers[i].focusOff();
                    }
                }
            }
        },
        //called whenever a marker is added to the ruler BUT NOT in the map
        _onMarkerAdd: function(e, data) {
            if (this.cfg.map) {
                $N.Util.selectMarkerTab(); //defined in mediaitem|_detail.html
                var idx = this.cfg.map.add(data.offset); //this will call the method below _onMarkerMapAdd,
                //which btw adds a new div to divmarkers
                //now update the indices for the div (which also sets the event bindings as clicks etc...
                this.updateIndices(idx);
                this.divFocus(idx);
            }
        },
        //fired from markermap, attached as listener above in
        //this.cfg.map.observe('add',this.attach(this._onMarkerMapAdd));
        //this method basically adds the html elements, but updateIndices must be called elsewhere after this function
        //(see _onMarkerAdd and loadHTTP)
        _onMarkerMapAdd: function(e, data) {
            if (this.cfg.map) {
                
                var idx = data.index;
                this.cfg.divmarkers.splice(idx,0, new $N.DivMarker(this.cfg.map));
                this.cfg.player.ruler.onMapAdd(data.marker, idx);
            }
        },

        //fired from markermap, attached as listener above in
        //this.cfg.map.observe('add',this.attach(this._onMarkerMapAdd));
        _onMarkerMapRemove: function(e, data) {
            if (this.cfg.map) {
                var idx = data.index;
                var divRemoved = this.cfg.divmarkers.splice(idx,1)[0]; //there is only one element removed
                divRemoved.remove();
                this.cfg.player.ruler.remove(idx);
                this.updateIndices(idx);
            
            }
        },

        updateIndices: function(from, to){
            if(from===undefined || from==null){
                from = 0;
            }
            var len = this.cfg.divmarkers.length-1;
            if(from>len){
                return;
            }
            if(to==undefined || to ==null){
                to = len;
            }
            if(to<from){
                var tmp = to;
                to=from;
                from=tmp;
            }
            for(var i = from; i <= to; i++){
                this.cfg.divmarkers[i].updateMarkerIndex(i);
            }
            this.cfg.player.ruler.updateMarkerIndices(from,to);
        },


        loadHTTP: function(){
            var itemId = ITEM_PUBLIC_ID;
            var map = this.cfg.map;
            var updateIndices = this.updateIndices;
            //var setTabs = $N.Util.setUpTabs;
            var util = $N.Util;
            var me = this;
            var onSuccess = function(data) {
                    var tabIndex = 0;
                    if(data){
                        if(data.result && data.result.length>0){
                            var result = data.result;

                            for(var i =0; i< result.length; i++){
                                map.add(result[i]);
                            }
                            //we call now updateindices
                            updateIndices.apply(me);
                            tabIndex = result.length>0 ? 1 : 0;
                        }

                    }
                    util.setUpTabs.apply(util, [tabIndex]);
            };
            json([itemId],"telemeta.get_markers", onSuccess);
        }
    });

    $N.notifyScriptLoad();

});