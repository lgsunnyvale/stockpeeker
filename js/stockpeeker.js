$(document).ready(function() {

    var app = (function() {
        var AppRouter = Backbone.Router.extend({
            routes: {
                '*actions': 'defaultAction'
            }
        });

        var el = $(".container");
        var containerTemplate = $("#container-template");
        var searchBar = $(".search");
        var searchButton = $(".search-icon");

        var getUrl = function(quote) {
            if (typeof quote === 'undefined') {
                quote = 'aapl';
            }
            var url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quotes%20where%20symbol%3D%22' + quote +'%22&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
            return url;
        }

        var getFallBackurl = function(quote) {
            if (typeof quote === 'undefined') {
                quote = 'aapl';
            }
            var url = 'http://ec2-54-224-143-194.compute-1.amazonaws.com/' + quote;
            return url;
        }

        return {
            run: function() {

                var app_router = new AppRouter();

                app_router.on('route:defaultAction', function (actions) {
                    var Stock = Backbone.Model.extend({
                        urlRoot: getUrl(this.quote),
                        longPolling : false,
                        intervalSeconds : 1,
                        initialize : function(){
                            _.bindAll(this, 'startLongPolling', 'stopLongPolling', 'executeLongPolling', 'onFetch', 'changeUrl');
                            this.noQuote = false;
                            this.wrongQuote = false;
                        },
                        startLongPolling : function(intervalSeconds){
                            this.longPolling = true;
                            if( intervalSeconds ){
                                this.intervalSeconds = intervalSeconds;
                            }
                            this.executeLongPolling();
                        },
                        stopLongPolling : function(){
                            this.longPolling = false;
                        },
                        executeLongPolling : function(){
                            this.fetch({
                                success : this.onFetch,
                                error: this.changeUrl
                            });
                        },
                        changeUrl: function() {
                            this.urlRoot = getFallBackurl(this.quote);
                            this.fetch({
                                success : this.onFetch,
                                error: function(error) {
                                    console.log("error: " + error);
                                }
                            });
                        },
                        onFetch : function (data) {
                            this.set(data);
                            this.trigger("dataRefreshed");
                            if( this.longPolling && !this.emptyQuote && !this.wrongQuote){
                                setTimeout(this.executeLongPolling, 1000 * this.intervalSeconds);
                            }
                        }
                    });

                    var StockView = Backbone.View.extend({
                        initialize: function () {
                            var self = this;
                            _.bindAll(this, 'render');
                            this.stock = new Stock();
                            this.stock.startLongPolling();
                            this.stock.on('change', self.render);
                            this.stock.on("dataRefreshed", function() {
                                self.render();
                                console.log("view refreshed");
                            })

                            var submitSearch = function(quote) {
                                self.stock.quote = quote;
                                self.stock.urlRoot = getUrl(quote);
                                self.stock.startLongPolling();
                            }
                            searchBar.keyup(function(event) {
                                var searchText;
                                if (event.keyCode === 13) {
                                    searchText = $(this).val();
                                    submitSearch(searchText);
                                }

                            searchButton.click(function() {
                                var searchText = searchBar.val();
                                submitSearch(searchText);
                            })

                            })
                        },
                        render: function() {
                            var self = this;
                            var results = this.stock.get("query").results;
                            if (!results) {
                                console.error("blank query");
                                this.stock.emptyQuote = true;
                            }
                            else {
                                var invalidSymbol = results.quote.ErrorIndicationreturnedforsymbolchangedinvalid;
                                if (results && !invalidSymbol) {
                                    var quoteData = results.quote;
                                    var html = _.template( containerTemplate.html(), quoteData);
                                    el.empty().html(html);
                                    this._addColor(quoteData);
                                    this.stock.emptyQuote = false;
                                    this.stock.wrongQuote = false;
                                }
                                else if (invalidSymbol) {
                                    console.error("wrong ticker");
                                    this.stock.wrongQuote = true;
                                    $(".wrong-ticker-alert").show();
                                    setTimeout(function() {
                                        $(".wrong-ticker-alert").hide();
                                    }, 2000);
                                }
                            }
                        },

                        _addColor: function(data) {
                            var dayChange = parseFloat(data.Change);
                            if (dayChange > 0) {
                                el.find(".day-price-change-arrow").addClass("priceUp glyphicon glyphicon-arrow-up");
                            }
                            else if (dayChange < 0) {
                                el.find(".day-price-change-arrow").addClass("priceDown glyphicon glyphicon-arrow-down");
                            }
                            var yearChange = parseFloat(data.ChangeFromTwoHundreddayMovingAverage);
                            if (yearChange > 0) {
                                el.find(".year-price-change-arrow").addClass("priceUp glyphicon glyphicon-arrow-up");
                            }
                            else if (yearChange < 0) {
                                el.find(".year-price-change-arrow").addClass("priceDown glyphicon glyphicon-arrow-down");
                            }
                        }

                    });

                    var stockView = new StockView();

                });

                    Backbone.history.start();

            }
        }
    })();

    app.run();

});