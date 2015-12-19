jQuery.fn.center = function () {
  this.css("position","absolute");
  this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + $(window).scrollTop()) + "px");
  this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + $(window).scrollLeft()) + "px");
  return this;
}

$(function(){
  $('.container').center()

  $(window).resize(function(){
    $('.container').center()
  })

  copySelectColorStyles()

  $('.color-selector').on('change', function(e){
    copySelectColorStyles(this);
    $('#input-parse-details').addClass('hide')
    var colorValue = calculateValueFromColorValues($('#band1').val(), $('#band2').val(), $('#multiplier').val())
    var resistorString = resistanceFloatToValueString(colorValue)
    $('#resistor-value').val(resistorString + " \u00B1" + $('#tolerance').val() + "%")
  });

  $('#resistor-value').on('change', function(e){
    update($(this).val())
  });

  $('#resistor-form').on('submit', function(e){
    e.preventDefault()
    update($('#resistor-value').val())
    if (document.activeElement != document.body) document.activeElement.blur();
  });

  var placeholderValue = getPlaceholderValue()
  $('#resistor-value').val(placeholderValue)
  $('#resistor-form').trigger('submit')

  $('#show-details').on('click', function(e){
    e.preventDefault()
    $('.details').slideDown();
    $('#hide-details').removeClass('hide')
    $(this).addClass('hide')
  })

  $('#hide-details').on('click', function(e){
    e.preventDefault()
    $('.details').slideUp();
    $('#show-details').removeClass('hide')
    $(this).addClass('hide')
  })
});

var update = function(resistorFieldVal){
  $('#input-parse-details').removeClass('hide')
  $('#ipt').html(resistorFieldVal)
  var resistorFloat = parseResistorStringToFloat(resistorFieldVal)
  if (resistorFloat > 99000000){
    alert("Values greater than 99M are not supported")
  } else if (resistorFloat < 0.1){
    alert("Values less than 0.1 are not supported")
  } else {
    var dropdownValues = valueStringToDropdownValues(resistorFloat, resistorFieldVal)
    $('#band1').val(dropdownValues[0])
    $('#band2').val(dropdownValues[1])
    $('#multiplier').val(dropdownValues[2])
    $('#tolerance').val(dropdownValues[3])
    copySelectColorStyles()
  }
}

var roundToleranceDown = function(tolerance){
  var values = $("#tolerance option").map(function() {return $(this).val()}).get().reverse()
  var i = index(values, function(x){ return x - tolerance })
  return values[i]
}

var valueStringToDropdownValues = function(resistorFloat, valueString){
  var resistanceString = resistanceFloatToValueString(resistorFloat)

  var bandString = resistanceString.replace(/^0+\.+/, '')
  var band1 = bandString.match(/\d/g)[0]
  var band2 = bandString.match(/\d/g)[1] || 0

  var multiplierChar = (resistanceString.match(/[kKmM]/) || ['r'])[0].toLowerCase()
  switch (multiplierChar) {
    case 'k':
      var multiplier = 1000
      break
    case 'm':
      var multiplier = 1000000
      break
    default :
      var multiplier = 1
  }
  multiplier = multiplier.toString() + (resistanceString.match(/0/g) || []).join('')

  // bunch of hacky manipulations to the multiplier 
  if (resistanceString.match(/[.]/) || resistorFloat < 10){
    multiplier = multiplier / 10
  }
  if (resistorFloat < 1){
    multiplier = multiplier / 100
  }
  if ((resistorFloat >= 10) && (band2 == 0)) {
    multiplier = multiplier / 10
  }

  var toleranceString = valueString.match(/[0-9.]+\s*%/g)
  if (toleranceString){
    var tolerance = toleranceString[0].match(/[0-9.]+/g)[0]
    if (tolerance < 0.05){
      tolerance = '20'
    } else {
      tolerance = roundToleranceDown(tolerance)
    }
  } else {
    var tolerance = '20'
  }

  return [band1, band2, multiplier, tolerance]
}

var parseResistorStringToFloat = function(resistorString){
  var strippedString = resistorString.replace(/[0-9.]+\s*%/g, '')
  strippedString = strippedString.replace(/[^0-9.rRkKmM]/g, '') // remove all whitespace and non r,k,m
  if (strippedString.indexOf('.') === -1){ // if no decimals
    strippedString = strippedString.replace(/[rRkKmM]/,'.') // replace the first letter with a decimal
    var baseValue = parseFloat(strippedString.replace(/[^0-9.]/g, '')) // remove all letters and parse
  } else {
    var baseValue = parseFloat(strippedString.replace(/[^0-9.]/g, '')) // remove all letters and parse
  }
  var multiplierString = resistorString.match(/[rRkKmM]/) || '' // find first letter or use a blank string
  var resistorFloat = parseFloat(baseValue)
  switch (multiplierString.toString().toLowerCase()) { // calculate the multiplier and return
    case "k":
      resistorFloat = resistorFloat * 1000
      break
    case "m":
      resistorFloat = resistorFloat * 1000000
      break
  }
  // we need to santitize to float to a realistic resitor value, IE not 1002 ohms.
  var santitizedString = sanitizeResistorFloat(resistorFloat)
  // console.log('input parsed as '+resistorFloat+' sanitized to '+santitizedString)
  $('#vpa').html(resistorFloat)
  $('#vst').html(santitizedString)
  return santitizedString
}

var sanitizeResistorFloat = function(resistorFloat){
  var resistorFloatString = resistorFloat.toString()
  var santitizedString = '';
  for (var i = 0; i < resistorFloatString.length; i++) {
    var digit = resistorFloatString.charAt(i)
    if ((santitizedString.match(/[0-9]/g) || []).length < (resistorFloat < 1 ? 3 : 2)) {
      santitizedString += digit
    } else if (digit.match(/[0-9]/g)) {
      santitizedString += '0'
    } else {
      santitizedString += digit
    }
  }
  return parseFloat(santitizedString)
}

var copySelectColorStyles = function(){
  $('.color-selector').each(function(){
    $dropdown = $(this)
    css = $dropdown.find(':selected').attr('style')
    $dropdown.attr('style', css)
  })
}

var calculateValueFromColorValues = function(color1, color2, multiplier){
  return ((parseInt(color1) * 10) + parseInt(color2)) * multiplier
}

var resistanceFloatToValueString = function(resistorFloat){
  var valueString = parseFloat(resistorFloat.toFixed(2)).toString()
  if (resistorFloat > 1.0){
    var numberOfZeroes = (valueString.match(/0/g) || []).length
    switch (numberOfZeroes){
      case 2:
        if (valueString.length > 3){
          valueString = (resistorFloat / 1000).toString() + 'K'
        } 
        break
      case 3:
        valueString = (resistorFloat / 1000).toString() + 'K'
        break
      case 4:
        valueString = (resistorFloat / 1000).toString() + 'K'
        break
      case 5:
        if (valueString.length > 6){
          valueString = (resistorFloat / 1000000).toString() + 'M'
        } 
        break
      case 6:
        valueString = (resistorFloat / 1000000).toString() + 'M'
        break
      case 7:
        valueString = (resistorFloat / 1000000).toString() + 'M'
        break
    }
  }
  return valueString
}

var getPlaceholderValue = function(){
  placeholderValues = ["9.1K \u00B15%","4.4 \u00B11%","200 \u00B15%","8.1M \u00B110%","27K \u00B15%","1.2K \u00B15%","8.3K \u00B15%", "0.2 \u00B10.5%"]
  return placeholderValues[Math.floor(Math.random()*placeholderValues.length)]
}

// binary search ripped from http://stackoverflow.com/questions/15203994/finding-the-closest-number-downward-to-a-different-number-from-an-array
function index(arr, compare) { // binary search, with custom compare function
  var l = 0,
    r = arr.length - 1;
  while (l <= r) {
    var m = l + ((r - l) >> 1);
    var comp = compare(arr[m]);
    if (comp < 0) // arr[m] comes before the element
      l = m + 1;
    else if (comp > 0) // arr[m] comes after the element
      r = m - 1;
    else // arr[m] equals the element
      return m;
  }
  return l-1; // return the index of the next left item
              // usually you would just return -1 in case nothing is found
}