/*
ToDo
 - fix javascript math
 - make sure to show the right mode on start to match value.
   maybe move four or five band mode to hidden field so it persists?
 - show status/details on current value?
 - investigate appcache not working
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
  $('#resistor-value').val(resistor.getValueString() + '\u03A9 \u00B1' + resistor.tolerance + '%') // ohm \u03A9 plusminus \u00B1 // '\u00B1' + resistor.tolerance + '%'
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

  // var tolerance = pickTolerance(resistor.availableTolerances(), $('#tolerance').val())
  // $toleranceOptions = $("#tolerance option[value='10'], #tolerance option[value='5'], #tolerance option[value='2'], #tolerance option[value='1']")
  // if (tolerance) {
  //   $('#tolerance').val(tolerance)
  //   $toleranceOptions.hide();
  //   $toleranceOptions.attr('disabled', 'disabled')
  //   $.each(resistor.availableTolerances(), function(i, tol){
  //     $("#tolerance option[value='" + tol + "']").show()
  //     $("#tolerance option[value='" + tol + "']").removeAttr('disabled')
  //   })   
  // } else {
  //   $toleranceOptions.show();
  //   $toleranceOptions.removeAttr('disabled')
  // }

  if (resistor.closestResistor) {
    if ((resistor.value == resistor.closestResistor.value) && (resistor.closestResistor.availableTolerances().indexOf($('#tolerance').val()) > -1)) {
      $('#real-value').hide()
    } else {
      var realTol = resistor.closestResistor.tolerance == '10' ? '5' : resistor.closestResistor.tolerance
      $('#real-value').attr('value', resistor.closestResistor.getValueString() + '\u03A9 ' + realTol + '%')
      $('#real-value').removeAttr('style').text("Standard Value: " + resistor.closestResistor.getValueString() + '\u03A9 \u00B1' + realTol + '%')
    }
  }
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

$(function(){
  window.resistorMode = '4band'
  window.resistorMaxSeries = 'E24'
  window.resistorUseRealValues = 'false'
  window.resistorForceFiveBand = 'false'

  // event binding
  // this could stand to be DRYd a bit
  $('#band-mode').on('click', function(e){
    $btn = $(this)
    if ($btn.data('mode') == '4band'){
      window.resistorMode = '5band'
      window.resistorMaxSeries = 'E96'
      window.resistorForceFiveBand = 'true'
      $btn.data('mode', '5band')
      $btn.text('Mode: 5 Band')
      $('#4band').hide()
      $('#5band').show()
    } else {
      window.resistorMode = '4band'
      window.resistorMaxSeries = 'E24'
      window.resistorForceFiveBand = 'false'
      $btn.data('mode', '4band')
      $btn.text('Mode: 4 Band')
      $('#4band').show()
      $('#5band').hide()
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
    var parsedValues = parseResistorString($('#resistor-value').val())
    try {
      window.resistor = new Resistor(parsedValues[0], parsedValues[1], null, window.resistorMaxSeries, window.resistorUseRealValues, window.resistorForceFiveBand)
    } catch (e) {
      alert(e)
    }
    updateEverything(resistor)
    copySelectColorStyles()
    if (document.activeElement != document.body) document.activeElement.blur();
  });

  $('#resistor-value').on('change', function(e){ // DRY up this pattern
    var parsedValues = parseResistorString($('#resistor-value').val())
    try {
      window.resistor = new Resistor(parsedValues[0], parsedValues[1], null, window.resistorMaxSeries, window.resistorUseRealValues, window.resistorForceFiveBand)
    } catch (e) {
      alert(e)
    }
    updateEverything(resistor)
    copySelectColorStyles()
  });

  $('#real-value').on('click', function(e){
    $('#resistor-value').val(this.value)
    $('#resistor-form').trigger('submit')
  })

  // onload execution
  if ($(window).height() >= $(document).height()) {
    $('.container').center()
    $(window).resize(function(){
      $('.container').center()
    })
  } 

  $('#resistor-form').trigger('submit')

  copySelectColorStyles()
})
