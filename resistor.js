jQuery.fn.center = function () {
  this.css("position","absolute");
  this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + $(window).scrollTop()) + "px");
  this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + $(window).scrollLeft()) + "px");
  return this;
}

window.errorDisplayedOnThisInput = false
e24Array = [10,11,12,13,15,16,18,20,22,24,27,30,33,36,39,43,47,51,56,62,68,75,82,91]
e12Array = [10,12,15,18,22,27,33,39,47,56,68,82]
e6Array = [10,15,22,33,47,68]

$(function(){

  $('#resistor-form').on('keyup', function(e){
    window.errorDisplayedOnThisInput = false
  })

  $('.container').center()

  $(window).resize(function(){
    $('.container').center()
  })

  copySelectColorStyles()

  $('.color-selector').on('change', function(e){
    copySelectColorStyles(this);
    var colorValue = calculateValueFromColorValues($('#band1').val(), $('#band2').val(), $('#multiplier').val())
    var resistorString = resistanceFloatToValueString(colorValue)
    $('#resistor-value').val(resistorString + " \u00B1" + $('#tolerance').val() + "%")
    $('#details-string').animate({width:'hide'},140);
    assignDropdownArrowColor(this)
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

  $('.color-selector').each(function(e){
    assignDropdownArrowColor(this)
  })
});

var assignDropdownArrowColor = function(dropdown){
  $dropdown = $(dropdown)
  color = $dropdown.css('color')
  $dropdown.siblings('.dropdown-arrow').css('color', color)
}

var update = function(resistorFieldVal){
  var parsedValues = parseResistorStringToFloat(resistorFieldVal)
  var resistorFloat = parsedValues[0]

  if (resistorFloat > 990000000){
    displayError("Values greater than 990M are not supported")
  } else if (resistorFloat < 0.1){
    displayError("Values less than 0.1 are not supported")
  } else {
    var dropdownValues = valueStringToDropdownValues(resistorFloat, resistorFieldVal)
    $('#band1').val(dropdownValues[0])
    $('#band2').val(dropdownValues[1])
    $('#multiplier').val(dropdownValues[2])
    $('#tolerance').val(dropdownValues[3])
    copySelectColorStyles()

    $('#sanitized-value').text(resistanceFloatToValueString(resistorFloat) + " \u2126")
    $('#details-string').animate({width:'show'},140);
  }
}

var displayError = function(msg){
  if (window.errorDisplayedOnThisInput === false){
    alert(msg)
    window.errorDisplayedOnThisInput = true
  }
}

var roundToleranceDown = function(tolerance){
  var values = $("#tolerance option").map(function() {return $(this).val()}).get().reverse()
  var i = index(values, function(x){ return x - tolerance })
  return values[i] || 5
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
  } else { // default tolerance to 5 because in my experience that is the most common
    var tolerance = '5'
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
  return [santitizedString, resistorFloat]
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
  var baseValue = parseInt(color1) * 10 + parseInt(color2)
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
        } else {
          valueString = (resistorFloat / 1000).toString() + 'K'
        }
        break
      case 6:
        valueString = (resistorFloat / 1000000).toString() + 'M'
        break
      case 7:
        valueString = (resistorFloat / 1000000).toString() + 'M'
        break
      case 8:
        valueString = (resistorFloat / 1000000).toString() + 'M'
        break
    }
  }
  return valueString
}

var getPlaceholderValue = function(){
  return "4.7K \u00B15%"
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
