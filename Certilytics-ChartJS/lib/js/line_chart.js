var visualize = function($element, layout, _this, chartjsUtils) {
  var id  = layout.qInfo.qId + "_chartjs_bar";

  var width_height = chartjsUtils.calculateMargin($element, layout);
  var width = width_height[0], height = width_height[1];

  //$element.empty();
  $element.html('<canvas id="' + id + '" width="' + width + '" height="'+ height + '"></canvas>');

  // Get the number of measures
  var num_of_measures = layout.qHyperCube.qMeasureInfo.length;

  var palette = [];
  var layout_color = 0;
  if (layout.colors == "auto") {
    palette = chartjsUtils.defineColorPalette("palette");
    layout_color = layout.color;
  } else {
    palette = layout.custom_colors.split("-");
  }

  // Color for main line
  var color = "rgba(" + palette[layout_color] + "," + layout.opacity + ")";

  // Color for sub-lines
  var line_color = [];

  if (layout.line_color_switch == "auto") {
    // When color selection is auto
    line_color[0] = "rgba(" + chartjsUtils.defineColorPalette("palette")[7] + ",1.0)";
  } else {
    // When color selection is custom and single
    if (layout.line_color_selection == "single") {
        line_color[0] = "rgba(" + chartjsUtils.defineColorPalette("palette")[layout.line_color_picker] + ",1.0)";
    } else {
      if ( layout.line_color_selection_for_measure == 'custom') {
        // Custom colors
        line_color = layout.line_custom_color.split("-");
      } else {
        // 12 colors or 100 colors
        line_color = chartjsUtils.defineColorPalette(layout.line_color_selection_for_measure);
      }
    }
  }

  var background_color = "";
  var background_custom_palette = [];
  if (layout.colors == "auto" && layout.background_color_switch) {
    background_color = "rgba(" + palette[layout.background_color] + "," + layout.opacity + ")";
  } else if (layout.colors == "auto") {
    background_color = "rgba(" + palette[layout.color] + "," + layout.opacity + ")";
  } else if (layout.colors == "custom" && layout.background_color_switch) {
    background_custom_palette = layout.custom_background_color.split("-");
    background_color = "rgba(" + background_custom_palette[0] + "," + layout.opacity + ")";
  } else if (layout.colors == "custom") {
    background_color = "rgba(" + palette[layout_color] + "," + layout.opacity + ")";
  } else {}

(layout.background_color_switch) ?  "rgba(" + palette[layout.background_color] + "," + layout.opacity + ")" : "rgba(" + palette[layout.color] + "," + layout.opacity + ")"

  var data = layout.qHyperCube.qDataPages[0].qMatrix;

  if (layout.cumulative) {
    data = chartjsUtils.addCumulativeValues(data);
  }

  // Create datasets
  var datasets = [{
      type: 'line',
      label: layout.qHyperCube.qMeasureInfo[0].qFallbackTitle,
      fill: layout.background_color_switch,
      data: data.map(function(d) { return { label: d[0].qText, x: d[0].qNum, y: d[1].qNum } }),
      backgroundColor: background_color,
      borderColor: color,
      pointBackgroundColor: color,
      borderWidth: 1,
      pointRadius: layout.point_radius_size
  }];

  // Where there more than 1 measures,
  if (num_of_measures >= 2) {

    for ( var i=2; i<=num_of_measures;i++) {
      // Applying color to line
      var borderColor = '';
      if ( layout.line_color_switch == "auto" || layout.line_color_selection == "single" ) {
        borderColor = line_color[0];
      } else {
        borderColor = "rgba(" + line_color[i-2] + ",1)";
      }

      datasets.push({
          type: 'line',
          label: layout.qHyperCube.qMeasureInfo[i-1].qFallbackTitle,
          data: data.map(function(d) {
              return { label: d[0].qText, x: d[0].qNum, y: d[i].qNum }
          }),
          backgroundColor: 'rgba(0,0,0,0)',
          borderColor: borderColor,
          pointBackgroundColor: 'rgba(0,0,0,0)',
          borderWidth: layout.line_width,
          pointRadius: 0
      })
    }
  }


  var ctx = document.getElementById(id);

  var myLineChart = new Chart(ctx, {
      data: {
          labels: data.map(function(d) { return d[0].qText; }),
          datasets: datasets
      },
      options: {
        title:{
            display: layout.title_switch,
            text: layout.title
        },
        legend: {
          display: (layout.legend_position == "hide") ? false : true,
          position: layout.legend_position,
          onClick: function(evt, legendItem) {
            //do nothing
          }
        },
        scales: {
          xAxes: [{
            type: layout.xscale_mode,
            position: "bottom",
            scaleLabel: {
              display: layout.datalabel_switch,
              labelString: layout.qHyperCube.qDimensionInfo[0].qFallbackTitle
            }
          }],
          yAxes: [{
            scaleLabel: {
              display: layout.datalabel_switch,
              labelString: layout.qHyperCube.qMeasureInfo[0].qFallbackTitle
            },
            ticks: {
              beginAtZero: layout.begin_at_zero_switch,
              callback: function(value, index, values) {
                return chartjsUtils.formatMeasure(value, layout, 0);
              }
            }
          }]
        },
        tooltips: {
            mode: 'label',
            callbacks: {
                label: function(tooltipItems, data) {
                    return data.datasets[tooltipItems.datasetIndex].label +': ' + chartjsUtils.formatMeasure(tooltipItems.yLabel, layout, 0);
                }
            }
        },
        responsive: true,
        events: ["mousemove", "mouseout", "click", "touchstart", "touchmove", "touchend"],
        onClick: function(evt) {
          var activePoints = this.getElementsAtEvent(evt);
          if(activePoints.length > 0) {
            chartjsUtils.makeSelectionsOnDataPoints(data[activePoints[0]._index][0].qElemNumber, _this);
          }
        }
      }
      // options: {
      //     scales: {
      //         yAxes: [{
      //             ticks: {
      //                 beginAtZero:true
      //             }
      //         }]
      //     }
      // }
  });
}
