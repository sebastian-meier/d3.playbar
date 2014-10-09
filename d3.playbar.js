/*exported playbar*/
/*global d3,spinner*/
/**
* d3 playbar widget
* @param (object) args
* @returns playbar object
*/
function playbar(args){

  //Default Element
  var defaults = {
    //height of the slider-play-bar and play/pause button including axis
    height : 77,
    //width of the play/pause button
    button_width : 50,
    //height of the axis below the play-bar
    axis_height : 20,
    //width of the axis right hand of the play-bar
    axis_width : 50,
    //margin between button and slider
    button_margin : 10,
    //relative, percentage size of the icon within the play/pause button
    icon_size : 50,
    //padding of scented graph visualization inside the play-bar
    graph_padding : 5,
    //width of the border
    border_width: 1,
    //By default the player will repeat after the last frame
    repeat : true,
    //By default the player will start after enough data is cached
    autoplay : true,

    //Name of the x column in the dataset
    x_name : "date",
    //Name of the y column in the dataset
    y_name : "price",

    //Calculated values
    bar_width :0,
    bar_height:0,
    button_height:0,
    icon_width:0,
    icon_height:0,

    //data holder
    data:false,
    //number of units
    data_size:100,
    //number of units loaded
    data_loaded:0,
    //position of the player head
    current:0,
    //status of widget (playing, pause, loading)
    status: 'loading',
    //Minimum Number of frames to load
    min_frame_load:20,
    //playback speed
    speed:100
  };

  //Interval Variable for the play-Function
  var interval = false;

  //Merge the initial option provided by the user with the default parameters
  var config = d3.tools.extend( defaults , args );

  config.bar_height = (config.height - 2*config.border_width - config.graph_padding - config.axis_height);
  config.button_height = (config.bar_height);
  config.icon_width = (config.button_width/100) * config.icon_size;
  config.icon_height = (config.button_height/100) * config.icon_size;

  //Defining the icons for the button
  var playIconData = [  { "x": (config.button_width-config.icon_width)/2,                       "y": (config.button_height-config.icon_height)/2},
                        { "x": (config.button_width-config.icon_width)/2,                       "y": (config.button_height-config.icon_height)/2 + config.icon_height},
                        { "x": (config.button_width-config.icon_width)/2 + config.icon_width,   "y": (config.button_height-config.icon_height)/2 + config.icon_height/2},
                        { "x": (config.button_width-config.icon_width)/2,                       "y": (config.button_height-config.icon_height)/2}
                      ];

  var pauseIconData1 = [  { "x": (config.button_width-config.icon_width)/2,                           "y": (config.button_height-config.icon_height)/2},
                          { "x": (config.button_width-config.icon_width)/2,                           "y": (config.button_height-config.icon_height)/2 + config.icon_height},
                          { "x": (config.button_width-config.icon_width)/2 + (config.icon_width/3),   "y": (config.button_height-config.icon_height)/2 + config.icon_height},
                          { "x": (config.button_width-config.icon_width)/2 + (config.icon_width/3),   "y": (config.button_height-config.icon_height)/2},
                          { "x": (config.button_width-config.icon_width)/2,                           "y": (config.button_height-config.icon_height)/2}
                        ];

  var pauseIconData2 = [  { "x": (config.button_width-config.icon_width)/2 + (config.icon_width/3)*2,  "y": (config.button_height-config.icon_height)/2},
                          { "x": (config.button_width-config.icon_width)/2 + (config.icon_width/3)*2,  "y": (config.button_height-config.icon_height)/2 + config.icon_height},
                          { "x": (config.button_width-config.icon_width)/2 + (config.icon_width/3)*3,  "y": (config.button_height-config.icon_height)/2 + config.icon_height},
                          { "x": (config.button_width-config.icon_width)/2 + (config.icon_width/3)*3,  "y": (config.button_height-config.icon_height)/2},
                          { "x": (config.button_width-config.icon_width)/2 + (config.icon_width/3)*2,  "y": (config.button_height-config.icon_height)/2}
                        ];

  //Function used to draw the icons
  var lineFunction = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .interpolate("linear");

  var x = d3.time.scale().range([0, config.bar_width]);
  var xAxis = d3.svg.axis().scale(x).ticks(Math.floor(config.bar_width/50)).orient("bottom");

  var y = d3.scale.linear().range([config.bar_height-1, 0]);
  var yAxis = d3.svg.axis().scale(y).ticks(3).orient("right");

  //This function is drawing the graph
  var graph_active = d3.svg.area()
    .interpolate("monotone")
    .x(function(d) { return x(d[config.x_name]); })
    .y0(config.bar_height-config.graph_padding)
    .y1(function(d) { return y(d[config.y_name]); });

  //This is a duplicate from the function above, this allows for more flexibility if you want to have different foreground and background graphs
  var graph_inactive = d3.svg.area()
    .interpolate("monotone")
    .x(function(d) { return x(d[config.x_name]); })
    .y0(config.bar_height-config.graph_padding)
    .y1(function(d) { return y(d[config.y_name]); });
  
  //Storing the selected containers and the brush
  var mySelection, brush;

  //Main Function
  function my(selection){
    dispatch.status(config.status);
    mySelection = selection;
    selection.each(function(){
      var el = d3.select(this);
      el.attr("class", "playbar");

      var container = el.append("g")
        .attr("class", "container")
        .attr("transform", "translate(0,"+config.graph_padding+")");

      /*------------------------------------------------------*/
      //Create Background Rectangles
      var bg = container.append("g").attr("class", "background_container");
      bg.append("rect")
        .attr("class", "background button")
        .attr("x", 0)
        .attr("y", 0)
        .on("click", my.togglePlayer)
        .attr("height", config.button_height)
        .attr("width", config.button_width);

      bg.append("rect")
        .attr("class", "background playbar")
        .attr("x", config.button_width+config.button_margin)
        .attr("y", 0)
        .attr("height", config.bar_height);

      /*------------------------------------------------------*/
      //Create the layer for the background data vis
      var data_background_container = container.append("g").attr("class", "data_background_container")
        .attr("transform", "translate(" + (config.button_width+config.button_margin+1) + ",0)");

      data_background_container.append("path")
        .attr("transform", "translate(0, "+(config.graph_padding-1)+")")
        .attr("class", "area inactive");

      data_background_container.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(-1," + (config.height-config.axis_height-config.graph_padding*2+2*config.border_width) + ")");

      data_background_container.append("g")
        .attr("class", "y axis");

      /*------------------------------------------------------*/
      //Create the layer for the foreground data vis
      var data_foreground_container = container.append("g").attr("class", "data_foreground_container")
        .attr("transform", "translate(" + (config.button_width+config.button_margin+1) + ",0)");

      //The whole tool is build upon css-classes and not ids to allow you to embed multiple playbars
      //Sadly the svg-mask is only working with ids, due to this we generate random ids for every mask
      var mask_id = my.randomID();

      data_foreground_container.append("path")
        .attr("transform", "translate(0, "+(config.graph_padding-0.5)+")")
        .attr("class", "area active")
        .attr("mask", "url(#"+mask_id+")")
        .attr("clip-path", "url(#"+mask_id+")");

      data_foreground_container.append("defs").append("clipPath")
        .attr("class", "clip")
        .attr("id", mask_id)
        .append("rect")
        .attr("transform", "translate(0,0)")
        .attr("height", config.bar_height);

      /*------------------------------------------------------*/
      //Create the ICONs (besides our progress indicator they will be invisible)
      var icons = container.append("g").attr("class", "icon_container loading");
      icons.append("path")
        .attr("class", "icon play")
        .attr("d", lineFunction(playIconData))
        .on("click", my.togglePlayer);

      var pause_icon = icons.append("g").attr("class", "icon pause");

      pause_icon.append("path").attr("d", lineFunction(pauseIconData1)).on("click", my.togglePlayer);
      pause_icon.append("path").attr("d", lineFunction(pauseIconData2)).on("click", my.togglePlayer);

      //Add spinner object
      var s = icons.append("g")
        .attr("class", "icon spinner")
        .attr("transform", "translate("+config.graph_padding+","+config.graph_padding+")");

      var mySpinner = spinner({
          width:config.button_width-config.graph_padding*2,
          height:config.button_height-config.graph_padding*2
      });
      s.call(mySpinner);

      /*------------------------------------------------------*/
      //Create Borders (self is a RETINA problem fix)
      var border = container.append("g").attr("class", "border_container");
      border.append("rect")
        .attr("class", "border button")
        .attr("x", config.border_width/2)
        .attr("y", config.border_width/2)
        .attr("height", config.button_height-config.border_width)
        .attr("width", config.button_width-config.border_width);

      border.append("rect")
        .attr("class", "border playbar")
        .attr("x", config.button_width+config.button_margin)
        .attr("y", config.border_width/2)
        .attr("height", config.bar_height-config.border_width);

      border.append("g")
        .attr("transform", "translate(" + (config.button_width+config.button_margin+1) + ",1)")
        .append("rect")
          .attr("class", "handle")
          .attr("x", 0)
          .attr("height", config.bar_height-2)
          .attr("width", 1);

      /*------------------------------------------------------*/
      //Create Brush
      var brush_container = container.append("g").attr("class", "brush_container");

      brush = d3.svg.brush()
        .x(x)
        .extent([0,0])
        .on("brush", my.brushed);

      var slider = brush_container.append("g")
        .attr("transform", "translate(" + (config.button_width+config.button_margin) + ",0)")
        .attr("class", "slider")
        .call(brush);

      slider.selectAll(".extent,.resize")
        .remove();

      slider.select(".background")
        .attr("height", config.bar_height+config.graph_padding);

    });

    my.resize();
  }

  //Creates a random id, used for unique ids for the SVG-masks
  my.randomID = function(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789";

    for( var i=0; i < 10; i++ ){
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  };

  //The playbar is responsive in regards to width changes, you simply need to apply css changes to the container and the playbar whithin will change
  my.resize = function(){
    mySelection.each(function(){

      //Get the elements width
      var el = d3.select(this);
      var width = this.getBoundingClientRect().width;

      //width/height of the play-bar (minus a 1px border)
      config.bar_width = width - config.button_margin - config.button_width - config.axis_width;

      el.select(".background.playbar").attr("width", config.bar_width);
      el.select(".clip rect").attr("width", (config.bar_width/config.data_size)*config.data_loaded);
      el.select(".border.playbar").attr("width", config.bar_width-config.border_width);

      //To save processing we will only change the following values if data was provided
      if(config.data){
        //x/y-scale on the play-bar
        x = d3.time.scale().range([0, (config.bar_width-1)]);
        xAxis = d3.svg.axis().scale(x).ticks(Math.floor((config.bar_width-1)/50)).orient("bottom");

        x.domain(d3.extent(config.data.map(function(d) { return d[config.x_name]; })));
        y.domain([0, d3.max(config.data.map(function(d) { return d[config.y_name]; }))]);

        brush.x(x);

        el.select("path.area.active")
          .datum(config.data)
          .attr("d", graph_active);

        el.select("path.area.inactive")
          .datum(config.data)
          .attr("d", graph_inactive);

        el.select(".handle").attr("x", ((config.bar_width-2)/config.data_size)*config.current);

        el.select("g.x.axis").call(xAxis);

        el.select("g.y.axis").attr("transform", "translate("+ (config.bar_width - 2*config.border_width) +",0)");

        el.select("g.slider .background")
          .attr("width", config.bar_width);

      }

    });
  };

  //brush function to change the playhead position
  my.brushed = function(){
    var value = brush.extent()[0];
    //This is making sure that the user doesn't click on a position beyond current loading progress
    if(x(value)>0 && x(value)<config.bar_width && (x(value)/config.bar_width) < config.data_loaded/config.data_size){
      
      config.current = Math.floor((x(value)/config.bar_width)*config.data_size);
      mySelection.each(function(){
        var el = d3.select(this);
        el.select(".handle").attr("x", ((config.bar_width-2)/config.data_size)*config.current);
      });
    }
  };

  //Toggle between play/pause, if still loading, nothing happens
  my.togglePlayer = function(){
    mySelection.each(function(){
      var el = d3.select(this);
      var container = el.select('.icon_container');
      if(container.attr("class").indexOf("playing")>-1){
        config.status = "pause";
        dispatch.status(config.status);
        d3.tools.removeClass(container, "playing");
        d3.tools.addClass(container, "pause");
        if(interval){
          clearInterval(interval);
          interval = false;
        }
      }else if(container.attr("class").indexOf("pause")>-1){
        config.status = "playing";
        dispatch.status(config.status);
        d3.tools.addClass(container, "playing");
        d3.tools.removeClass(container, "pause");
        interval = setInterval(function(){my.play();}, config.speed);
      }else{
        d3.tools.addClass(el, "loading");
        d3.tools.removeClass(container, "playing");
        d3.tools.removeClass(container, "pause");
      }
    });
  };

  //Toggle from loading to playing/pause (if autoplay is true then playing)
  my.enoughData = function(){
    mySelection.each(function(){
      var el = d3.select(this);
      var container = el.select('.icon_container');
      d3.tools.removeClass(container, "loading");
      if(config.autoplay){
        config.status = "playing";
        d3.tools.addClass(container, "playing");
        d3.tools.removeClass(container, "pause");
      }else{
        config.status = "pause";
        d3.tools.addClass(container, "pause");
        d3.tools.removeClass(container, "playing");
      }
      dispatch.status(config.status);
      
      if(config.status === "playing"){
        interval = setInterval(function(){my.play();}, config.speed);
      }
    });
  };

  //Function called by the interval to move the playhead forwards
  my.play = function(){
    config.current++;
    if(config.current > config.data_loaded+1){
      config.current = config.data_loaded;
    }
    if(config.current>config.data_size){
      config.current = 0;
      if(!config.repeat){
        clearInterval(interval);
        interval = false;
        mySelection.each(function(){
          var el = d3.select(this);
          var container = el.select('.icon_container');
          config.status = "pause";
          dispatch.status(config.status);
          d3.tools.removeClass(container, "playing");
          d3.tools.addClass(container, "pause");
        });
      }
    }
    mySelection.each(function(){
      var el = d3.select(this);
      el.select(".handle").attr("x", ((config.bar_width-2)/config.data_size)*config.current);
    });
    dispatch.change(config.current);
  };

  //Variables used to calculate the estimated loading time to completion
  var timing = {
    timestamp : 0,
    avrg_speed : 0,
    avrg_size : 0
  };

  //This function needs to be called from the outside with the number(count) of the currently loaded frame as well as the size of the data for the current frame
  my.loading = function(count, size){
    config.data_loaded = count;

    var zeit = new Date();

    if(timing.timestamp === 0){
      timing.timestamp = zeit.getTime()-1;
    }

    var diff = size / (zeit.getTime()-timing.timestamp);
    timing.avrg_speed = (timing.avrg_speed*config.data_loaded + diff)/(config.data_loaded+1);
    timing.avrg_size = (timing.avrg_size*config.data_loaded + size)/(config.data_loaded+1);

    if(
      //We wait until at least "min_frame_load" are loaded to make sure the calculated average is more precise
      (config.data_loaded > config.min_frame_load)&&
      //Make sure the animation did not already start
      (config.status === "loading")&&
      //Here we calculate the time left to load the whole animation. If the time left is smaller than the time required to play the whole movie we autostart the movie.
      (
        (config.data_size*config.speed) > ((config.data_size-config.data_loaded)*timing.avrg_speed*1.1)
      )){

      my.enoughData();
    }

    mySelection.each(function(){
      d3.select(this).select(".clip rect").attr("width", (config.bar_width/config.data_size)*config.data_loaded);
    });
    
    //If all data is loaded and the player didn't already switch to playing/pause
    if(config.data_loaded === config.data_size){
      if(config.status === "loading"){
        my.enoughData();
      }
    }
  };

  //This function needs to be called from the outside, data is the dataset for the background data layer
  my.data = function(data){
    config.data = data;
    config.data_size = data.length;
    config.min_frame_load = data.length*0.2;

    x.domain(d3.extent(data.map(function(d) { return d[config.x_name]; })));
    y.domain([0, d3.max(data.map(function(d) { return d[config.y_name]; }))]);

    mySelection.each(function(){
      var el = d3.select(this);
      el.select("path.area.active")
        .datum(data)
        .attr("d", graph_active);

      el.select("path.area.inactive")
        .datum(data)
        .attr("d", graph_inactive);

      el.select("g.x.axis").call(xAxis);

      el.select("g.y.axis").call(yAxis);

    });

    my.resize();
  };

  d3.select(window).on('resize', function(){ my.resize(); });

  var dispatch = d3.dispatch('change', 'status');
  d3.rebind(my, dispatch, "on");

  return my;
}