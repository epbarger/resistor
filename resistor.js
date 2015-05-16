$(function(){
  $('#c2v-form').on('submit', function(e){
    e.preventDefault();
    var value = $('#c2v-input').val()
    var floatVal = parseResistorStringToFloat(value)
    var colorCode = calculateColorCodeFromFloat(floatVal)
    $('#resistor-value').text(value + ' \u03A9')
    $('#resistor-color-code').text(colorCode)
    $('.res-one').css('background-color', colorCode[0]);
    $('.res-two').css('background-color', colorCode[1]);
    $('.res-three').css('background-color', colorCode[2]);
  });
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
  return resistorFloat
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
