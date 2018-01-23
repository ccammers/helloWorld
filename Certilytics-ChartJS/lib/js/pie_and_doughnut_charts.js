var visualize = function ($element, layout, _this, chartjsUtils) {
  var id = layout.qInfo.qId + "_chartjs_bar";

  var width_height = chartjsUtils.calculateMargin($element, layout);
  var width = width_height[0], height = width_height[1];

  //$element.empty();
  $element.html('<canvas id="' + id + '" width="' + width + '" height="' + height + '"></canvas>');

  var palette = [];
  if (layout.colors == "auto") {
    palette = chartjsUtils.defineColorPalette(layout.color_selection);
  } else {
    palette = layout.custom_colors.split("-");
  }

  var data = layout.qHyperCube.qDataPages[0].qMatrix;

  console.log(layout);

  var color_count = 12;
  if (layout.colors == "auto" && layout.color_selection == "one-handred") {
    color_count = 100;
  } else if (layout.colors == "custom") {
    color_count = palette.length;
  }

  var palette_r = data.map(function (d, index) {
    return "rgba(" + palette[index % color_count] + "," + layout.opacity + ")";
  })

  if (layout.cumulative) {
    data = chartjsUtils.addCumulativeValues(data);
  }

  var ctx = document.getElementById(id);

  var orderOfMagnitudes = {
    trillions: 1000000000000,
    billions:  1000000000,
    millions:  1000000,
    thousands: 1000,
    other: 0
  };

  function getOrderOfMagnitude(val) {
    var oom = 0;
    for (var propName in orderOfMagnitudes) {
      var _oom = orderOfMagnitudes[propName];
      if (val >= _oom && _oom > oom) {
        oom = _oom;
      }
    }
    return oom;
  }

  function calcLargestFittingFontSize(ctx, currentFontSize, str, rectWidth, rectHeight) {
    const textWidthCurrent = ctx.measureText(str).width;
    const fontSizeTopMultiplier = Math.min(rectWidth / textWidthCurrent, rectHeight / currentFontSize);
    const fontSizeTopNew = Math.floor(currentFontSize * fontSizeTopMultiplier);
    return fontSizeTopNew;
  }

  function getOrderOfMagnitudeText(oom) {
    switch (oom) {
      case orderOfMagnitudes.trillions: return "TRILLION";
      case orderOfMagnitudes.billions: return "BILLION";
      case orderOfMagnitudes.millions: return "MILLION";
      case orderOfMagnitudes.thousands: return "THOUSAND";
      case orderOfMagnitudes.other: return null;
      default: return "Unhandle Order Of Magnitude";
    }
  }

  function anchorToOrderOfMagnitude(num, oom) {
    return oom ? Math.ceil(num / oom * 10) / 10 : num;
  }

  var myRadarChart = new Chart(ctx, {
    type: layout.pie_doughnut,
    data: {
      labels: data.map(function (d) { return d[0].qText; }),
      datasets: [{
        label: layout.qHyperCube.qMeasureInfo[0].qFallbackTitle,
        fill: layout.background_color_switch,
        data: data.map(function (d) { return d[1].qNum; }),
        backgroundColor: palette_r,
        borderColor: palette_r,
        pointBackgroundColor: palette_r,
        borderWidth: 1
      }]
    },
    options: {
      title: {
        display: layout.title_switch,
        text: layout.title
      },
      legend: {
        display: (layout.legend_position == "hide") ? false : true,
        position: layout.legend_position,
        onClick: function (evt, legendItem) {
          var values = [];
          var dim = 0;
          if (data[legendItem.index][0].qElemNumber < 0) {
            //do nothing
          } else {
            values.push(data[legendItem.index][0].qElemNumber);
            _this.selectValues(dim, values, true);
          }
        }
      },
      scale: {
        ticks: {
          beginAtZero: layout.begin_at_zero_switch,
          callback: function (value, index, values) {
            return chartjsUtils.formatMeasure(value, layout, 0);
          }
        }
      },
      tooltips: {
        mode: 'label',
        callbacks: {
          label: function (tooltipItems, data) {
            return data.labels[tooltipItems.index] + ': ' + chartjsUtils.formatMeasure(data.datasets[0].data[tooltipItems.index], layout, 0);
          }
        }
      },
      responsive: true,
      events: ["mousemove", "mouseout", "click", "touchstart", "touchmove", "touchend"],
      onClick: function (evt) {
        var activePoints = this.getElementsAtEvent(evt);
        if (activePoints.length > 0) {
          chartjsUtils.makeSelectionsOnDataPoints(data[activePoints[0]._index][0].qElemNumber, _this);
        }
      }
    },
    // options: {
    //     scales: {
    //         yAxes: [{
    //             ticks: {
    //                 beginAtZero:true
    //             }
    //         }]
    //     }
    // }
    plugins: [{
      afterDraw: function(chartController) {
        const ctx = chartController.chart.ctx;

        const chartArea = chartController.chartArea;
        const chartWidth = chartArea.right - chartArea.left;
        const chartHeight = chartArea.bottom - chartArea.top;

        const squareLength = 1.4 * chartController.innerRadius; // 1.3 is just a multiplicitive value slightly smaller than figuring all the math. Aka this is a shortcut.


        // ctx.strokeStyle = "black";
        // ctx.beginPath();
        // ctx.moveTo(0, 0);
        // ctx.lineTo(chartWidth, chartHeight);
        // ctx.moveTo(chartWidth, 0);
        // ctx.lineTo(0, chartHeight);
        // ctx.stroke();


        const font = "Arial";
        const fontSize = 10;
        ctx.font = fontSize + "px " + font;


        // Top Text Calcs

        const grandTotal = layout.qHyperCube.qGrandTotalRow[0].qNum;
        const grandTotalQText = layout.qHyperCube.qGrandTotalRow[0].qText;
        const orderOfMagnitude = getOrderOfMagnitude(grandTotal);
        const anchoredGrandTotal = anchorToOrderOfMagnitude(grandTotal, orderOfMagnitude);

        console.log(orderOfMagnitude);


        const topText = grandTotalQText.length > 0
                        && grandTotal.toString()[0] !== grandTotalQText[0]
                        ?  grandTotalQText[0] + anchoredGrandTotal
                        : anchoredGrandTotal.toString();

        const fontSizeTopNew = calcLargestFittingFontSize(ctx, fontSize, topText, squareLength, squareLength / 2);
        
        
        // Bottom Text Calcs
        
        const bottomText = getOrderOfMagnitudeText(orderOfMagnitude);
        
        const fontSizeBottomNew = !bottomText
                                  ? null
                                  : calcLargestFittingFontSize(ctx, fontSize, bottomText, squareLength, squareLength / 2);
        
        // Adjustment Calcs

        const adjustmentAmount = fontSizeBottomNew
                                 ? Math.floor((Math.max(fontSizeTopNew, fontSizeBottomNew) - Math.min(fontSizeTopNew, fontSizeBottomNew)) / 2) // NOTE: Supposed to be divided by 2 to be "accurate". But dividing by 3 seems to be more perceptually accurate
                                 : Math.floor(fontSizeTopNew / 2);

        const adjustUp = Math.max(fontSizeTopNew, fontSizeBottomNew) === fontSizeBottomNew;
        const adjustment = adjustmentAmount * (adjustUp ? -1 : 1);
        
        // console.log(adjustUp);
        // console.log(adjustment);

        // Draw Text
        
        ctx.textAlign = "center";
        
        ctx.fillStyle = "rgb(171,219,243)";
        ctx.font = fontSizeTopNew + "px " + font;
        ctx.fillText(topText, chartWidth / 2, chartHeight / 2 - fontSizeTopNew + adjustment);//- fontSizeTopNew + adjustment);
        
        if (bottomText) {
          ctx.fillStyle = "#777";
          ctx.font = fontSizeBottomNew + "px " + font;
          ctx.fillText(bottomText, chartWidth / 2, chartHeight / 2 + adjustment);
        }
      }
    }]
  });
}
