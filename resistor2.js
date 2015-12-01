$(function(){
  copySelectColorStyles()

  $('.color-selector').on('change', function(e){
    copySelectColorStyles(this);
    var colorValue = calculateValueFromColorValues($('#band1').val(), $('#band2').val(), $('#multiplier').val())
    var resistorString = resistanceFloatToValueString(colorValue)
    $('#resistor-value').val(resistorString + " \u00B1" + $('#tolerance').val() + "%")
  });

  $('#resistor-value').on('change', function(e){
    var resistorFloat = parseResistorStringToFloat($(this).val())
    console.log(resistorFloat)
    if (resistorFloat > 99000000){
      alert("Values greater than 99M are not supported")
    } else if (resistorFloat < 0.1){
      alert("Values less than 0.1 are not supported")
    } else {
      var dropdownValues = valueStringToDropdownValues(resistorFloat, $(this).val())
      $('#band1').val(dropdownValues[0])
      $('#band2').val(dropdownValues[1])
      $('#multiplier').val(dropdownValues[2])
      $('#tolerance').val(dropdownValues[3])
      copySelectColorStyles()
    }
  });
});

var valueStringToDropdownValues = function(resistorFloat, valueString){
  var resistanceString = resistanceFloatToValueString(resistorFloat)

  var band1 = resistanceString.match(/\d/g)[0]
  var band2 = resistanceString.match(/\d/g)[1] || 0

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
  if (resistanceString.match(/[.]/) || resistorFloat < 10){
    multiplier = multiplier / 10
  }
  if (resistorFloat < 1){
    multiplier = multiplier / 10
    var tmp = band1
    band1 = band2
    band2 = tmp
  }

  // var toleranceString = valueString.match(/[0-9.]+\s*%/g)
  // if (toleranceString){
  //   var tolerance = toleranceString[0].match(/[0-9.]+/g)[0]
  //   if (tolerance >= 20) { tolerance = 'none' }
  // } else {
  //   var tolerance = 'none'
  // }
  // console.log(toleranceString)

  return [band1, band2, multiplier, tolerance]
}

var parseResistorStringToFloat = function(resistorString){
  var strippedString = resistorString.replace(/[^0-9.rRkKmM]/g, '') // remove all whitespace and non r,k,m
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
  return sanitizeResistorFloat(resistorFloat)
}

var sanitizeResistorFloat = function(resistorFloat){
  var resistorFloatString = resistorFloat.toString()
  var santitizedString = '';
  for (var i = 0; i < resistorFloatString.length; i++) {
    var digit = resistorFloatString.charAt(i)
    if (santitizedString.replace(/[^0-9]/g, '').length < 2){ // if there are less than two numbers in the santized string
      santitizedString += digit
    } else {
      santitizedString += '0'
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