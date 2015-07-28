/*
  TODO 
  - add color to value mode
  - add link to parts
  - implement color mapping so I can customize the color code colors

  MAYBE
  - add E12 and E24 recognition
*/

$(function(){
  $('#c2v-form').on('submit', function(e){
    e.preventDefault();
    var value = $('#c2v-input').val()
    var toleranceValue = parseInt( $('#c2v-tolerance').val() )
    if (value !== ''){
      var floatVal = parseResistorStringToFloat(value)
      console.log("Input interpreted as: " + floatVal)

      if (floatVal > 10000000){
        alert("Values greater than 10M \u03A9 are not supported")
      } else if (floatVal < 0.1) {
        alert("Values less than 0.1 \u03A9 are not supported")
      } else {
        var colorCode = calculateColorCodeFromFloat(floatVal)
        var toleranceColorCode = calculateToleranceFromInt(toleranceValue)
        var valueString = resistanceFloatToValueString(floatVal)
        $('#resistor-value').text(valueString + ' \u03A9')
        $('#resistor-color-code').text(colorCode)
        $('.res-one').css('background-color', colorCode[0]);
        $('.res-two').css('background-color', colorCode[1]);
        $('.res-three').css('background-color', colorCode[2]);
        $('.res-tol').css('background-color', toleranceColorCode);
      }
    }
  });

  var placeholderValue = getPlaceholderValue()
  $('#c2v-input').val(placeholderValue)
  $('#c2v-input').attr("placeholder", "Example: " + placeholderValue)
  $('#c2v-form').trigger('submit')
  $('#c2v-input').val(null)
});

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

var calculateColorCodeFromFloat = function(resistorFloat){
  resistorString = resistorFloat.toFixed(2).toString()
  colorArray = ['silver', 'gold', 'black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'gray', 'white']

  var multiplierIndex = resistorString.split('.')[0]
  if (multiplierIndex === '0') {
    var multiplier = colorArray[0]
  } else {
    var multiplier = colorArray[multiplierIndex.length]
  }

  colorArray = colorArray.slice(2) // remove silver and gold
  var baseValueIndices = resistorString.replace(/[0.]/g,'').split('')
  baseValueIndices.push('0')

  var firstBand = colorArray[parseInt(baseValueIndices.shift())]
  var secondBand = colorArray[parseInt(baseValueIndices.shift())]

  return [firstBand, secondBand, multiplier]
}

var calculateToleranceFromInt = function(toleranceInt){
  switch(toleranceInt){
    case 10:
      return "silver"
      break
    case 5:
      return "gold"
      break
    case 1:
      return "brown"
      break
  }
}

var getPlaceholderValue = function(){
  placeholderValues = ["9.1K","4.4","200","8.1M","27K","1.2K","8.3K", "0.2"]
  return placeholderValues[Math.floor(Math.random()*placeholderValues.length)]
}
