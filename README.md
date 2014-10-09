d3.playbar
==========

**An interface for timeseries data visualizations**

## Config

```
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

    //Minimum Number of frames to load
    min_frame_load:20,
    //playback speed
    speed:100
  };
```

## Usage

```
//Initiate
var attr = {repeat:false};
var myPlaybar = playbar(attr);

//Add listeners to the change event - call for every change of the playhead position
myPlaybar.on("change", function(status){ console.log(status); });

//Add listeners to the status event - call for every change on loading/playing/pause
myPlaybar.on("status", function(status){ console.log(status); });

//Apply playbar to an svg-container
d3.select('#playbar').append("svg").call(myPlaybar);

//Load Data and send it to the playbar, to generate the preview graph
myPlaybar.data(data);

LOADING SEQUENCE{
	//Here we tell the playbar which piece of the data we just loaded and the size of the data loaded
	myPlaybar.loading(data_size, 200);
}
```

For more information checkout the example

## License

My code is published under the MIT/GPL.

* http://en.wikipedia.org/wiki/MIT_License
* http://en.wikipedia.org/wiki/GNU_General_Public_License

If you make enhancements or code changes i would love to know so i can reshare your findings.