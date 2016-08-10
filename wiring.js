/*
ToDo
  - ???
*/

jQuery.fn.center = function () {
  this.css("position","absolute");
  this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + $(window).scrollTop()) + "px");
  this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + $(window).scrollLeft()) + "px");
  return this;
}

var copySelectColorStyles = function(){
  $('.color-selector').each(function(){
    $dropdown = $(this)
    css = $dropdown.find(':selected').attr('style')
    $dropdown.attr('style', css)
    assignDropdownArrowColor(this)
  })
}

var assignDropdownArrowColor = function(dropdown){
  $dropdown = $(dropdown)
  color = $dropdown.css('color')
  $dropdown.siblings('.dropdown-arrow').css('color', color)
}

var updateEverything = function(resistor) {
  // console.log(resistor)
  $('#resistor-value').val(resistor.getValueString() + '\u03A9 \u00B1' + (resistor.tolerance ? resistor.tolerance : $('#tolerance').val()) + '%') // ohm \u03A9 plusminus \u00B1 // '\u00B1' + resistor.tolerance + '%'
  $('.band1').val(resistor.bands[0])
  $('.band2').val(resistor.bands[1])
  var bandsLength = resistor.bands.length
  if (bandsLength == 5){
    $('.band3').val(resistor.bands[2])
  } else {
    $('.band3').val('0')
  }
  $('.multiplier').val(resistor.bands[bandsLength-2])

  if (resistor.tolerance) {
    $('#tolerance').val(resistor.tolerance)
  }

  if (resistor.closestResistor) {
    if ((resistor.value == resistor.closestResistor.value) && (resistor.closestResistor.availableTolerances().indexOf($('#tolerance').val()) > -1)) {
      var seriesMap = { '10': 'E12', '5': 'E24', '2': 'E48', '1': 'E96'}
      $('#series').text('Series: ' + seriesMap[$('#tolerance').val()]).show()
      $('#real-value').hide()
    } else {
      $('#series').hide()
      var realTol = resistor.closestResistor.tolerance == '10' ? '5' : resistor.closestResistor.tolerance
      $('#real-value').attr('value', resistor.closestResistor.getValueString() + '\u03A9 ' + realTol + '%')
      $('#real-value').show().text("Standard Value: " + resistor.closestResistor.getValueString() + '\u03A9 \u00B1' + realTol + '%')
    }
  }
}

var triggerUpdate = function(){
  var parsedValues = parseResistorString($('#resistor-value').val())
  try {
    window.resistor = new Resistor(parsedValues[0], parsedValues[1], null, window.resistorMaxSeries, window.resistorUseRealValues, window.resistorForceFiveBand)
  } catch (e) {
    alert(e)
  }
  $('.color-row').css('opacity', 1.0)
  updateEverything(resistor)
  copySelectColorStyles()
}

var pickTolerance = function(availableTolerances, oldTolerance) {
  if (availableTolerances.indexOf(oldTolerance) >= 0){
    return oldTolerance
  } else {
    if (availableTolerances[0] == '10'){
      return '5'
    } else {
      return availableTolerances[0]
    }
  }
}

var setMode = function(bands){
  if (bands == 5){
    window.resistorMode = '5band'
    window.resistorMaxSeries = 'E96'
    window.resistorForceFiveBand = 'true'
    $('#4band').hide()
    $('#5band').show()
    $('#mode-store').val('5band')
  } else {
    window.resistorMode = '4band'
    window.resistorMaxSeries = 'E24'
    window.resistorForceFiveBand = 'false'
    $('#4band').show()
    $('#5band').hide()
    $('#mode-store').val('4band')
  }
}

$(function(){
  // event binding
  $('#band-mode').on('click', function(e){
    $btn = $(this)
    if ($('#mode-store').val() == '4band'){
      setMode(5)
      $btn.text('Mode: 5 Band')
    } else {
      setMode(4)
      $btn.text('Mode: 4 Band')
    }
    $('#resistor-form').trigger('submit')
  })

  $('#parse-mode').on('click', function(e){
    $btn = $(this)
    if ($btn.data('mode') == 'real'){
      window.resistorUseRealValues = 'false'
      $btn.data('mode', 'fake')
      $btn.text('Parsing: Normal')
    } else {
      window.resistorUseRealValues = 'true'
      $btn.data('mode', 'real')
      $btn.text('Parsing: Real Values')
    }
    $('#resistor-form').trigger('submit')
  })

  $('.color-selector').on('change', function(e){
    if (window.resistorMode == '4band'){
      var bands = [$('#4band .band1').val(), $('#4band .band2').val(), $('#4band .multiplier').val(), $('#tolerance').val()]
    } else {
      var bands = [$('#5band .band1').val(), $('#5band .band2').val(), $('#5band .band3').val(), $('#5band .multiplier').val(), $('#tolerance').val()]
    }
    window.resistor = new Resistor(null, null, bands, window.resistorMaxSeries, window.resistorUseRealValues, window.resistorForceFiveBand)
    updateEverything(resistor)
    copySelectColorStyles()
  });

  $('#resistor-form').on('submit', function(e){
    e.preventDefault()
    triggerUpdate()
    if (document.activeElement != document.body) document.activeElement.blur();
  });

  $('#resistor-value').on('change', triggerUpdate);

  $('#resistor-value').on('keyup', function(e){
    $('.color-row').fadeTo(200, 0.2);
  })

  $('#real-value').on('click', function(e){
    $('#resistor-value').val(this.value)
    $('#resistor-form').trigger('submit')
  })


  // onload execution
  window.resistorMode = '4band'
  window.resistorMaxSeries = 'E24'
  window.resistorUseRealValues = 'false'
  window.resistorForceFiveBand = 'false'

  if ($('#mode-store').val() == '5band') {
    $btn = $('#band-mode')
    $btn.text('Mode: 5 Band')
    setMode(5)
  }

  if ($(window).height() >= $(document).height()) {
    $('.container').center()
    $(window).resize(function(){
      $('.container').center()
    })
  } 

  $('#resistor-form').trigger('submit')
  copySelectColorStyles()
})
