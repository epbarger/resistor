var E12Base = [0.10, 0.12, 0.15, 0.18, 0.22, 0.27, 0.33, 0.39, 0.47, 0.56, 0.68, 0.82]
var E24Base = [0.10, 0.11, 0.12, 0.13, 0.15, 0.16, 0.18, 0.20, 0.22, 0.24, 0.27, 0.30, 0.33, 0.36, 0.39, 0.43, 0.47, 0.51, 0.56, 0.62, 0.68, 0.75, 0.82, 0.91]
var E48Base = [0.100, 0.105, 0.110, 0.115, 0.121, 0.127, 0.133, 0.140, 0.147, 0.154, 0.162, 0.169, 0.178, 0.187, 0.196, 0.205, 0.215, 0.226, 0.237, 0.249,
               0.261, 0.274, 0.287, 0.301, 0.316, 0.332, 0.348, 0.365, 0.383, 0.402, 0.422, 0.442, 0.464, 0.487, 0.511, 0.536, 0.562, 0.590, 0.619, 0.649,
               0.681, 0.715, 0.750, 0.787, 0.825, 0.866, 0.909, 0.953]
var E96Base = [0.100, 0.102, 0.105, 0.107, 0.110, 0.113, 0.115, 0.118, 0.121, 0.124, 0.127, 0.130, 0.133, 0.137, 0.140, 0.143, 0.147, 0.150, 0.154, 0.158,
               0.162, 0.165, 0.169, 0.174, 0.178, 0.182, 0.187, 0.191, 0.196, 0.200, 0.205, 0.210, 0.216, 0.221, 0.226, 0.232, 0.237, 0.243, 0.249, 0.255,
               0.261, 0.267, 0.274, 0.280, 0.287, 0.294, 0.301, 0.309, 0.316, 0.324, 0.332, 0.340, 0.348, 0.357, 0.365, 0.374, 0.383, 0.392, 0.402, 0.412,
               0.422, 0.432, 0.442, 0.453, 0.464, 0.475, 0.487, 0.499, 0.511, 0.523, 0.536, 0.549, 0.562, 0.576, 0.590, 0.604, 0.619, 0.634, 0.649, 0.665,
               0.681, 0.698, 0.715, 0.732, 0.750, 0.768, 0.787, 0.806, 0.825, 0.845, 0.866, 0.887, 0.909, 0.931, 0.953, 0.976]

var generateStandardSeries = function(seriesArray) {
  var output = []
  var multipliers = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000]
  for (var i = 0; i < multipliers.length; i++) {
    output = output.concat( seriesArray.map(function(val){ return Math.round(multipliers[i] * val * 10000) / 10000 }) )
  }
  return output
}

E12 = generateStandardSeries(E12Base)
E24 = generateStandardSeries(E24Base)
E48 = generateStandardSeries(E48Base)
E96 = generateStandardSeries(E96Base)

// precompute search values that are used in the closestRealValue function
var SearchValues = [E12,
                    [].concat(E12, E24).sort(function(a, b){return a-b}),
                    [].concat(E12, E24, E48).sort(function(a, b){return a-b}),
                    [].concat(E12, E24, E48, E96).sort(function(a, b){return a-b})]

function findNearestNumericalMatch(arr, targetNumber){
  var delta = null
  var deltaIncreased = false
  var i = 0
  while(!deltaIncreased && i < arr.length){
    deltaTmp = Math.abs(arr[i] - targetNumber)
    if (delta == null || deltaTmp <= delta) {
      delta = deltaTmp
    } else if (deltaTmp > delta) {
      return arr[i - 1]
    }
    i++
  }
  return arr[i-1]
}

// not super happy with this parsing code but it seems to work consistently
var parseResistorString = function(unparsedString){
  // parse resistor value
  var strippedString = unparsedString.replace(/[0-9.]+\s*%/g, '')
  strippedString = strippedString.replace(/[^0-9.rRkKmM]/g, '') // remove all whitespace and non r,k,m
  if (strippedString.indexOf('.') === -1){ // if no decimals
    strippedString = strippedString.replace(/[rRkKmM]/,'.') // replace the first letter with a decimal
  }
  var value = parseFloat(strippedString.replace(/[^0-9.]/g, '')) // remove all letters and parse
  var multiplierString = (unparsedString.match(/[rRkKmM]/g) || [''])[0].toUpperCase() // find first letter or use a blank string
  if (multiplierString == 'K') {
    value = value * 1000
  } else if (multiplierString == 'M') {
    value = value * 1000000
  }

  // parse tolerance
  var tolerance = null
  var toleranceString = unparsedString.match(/[0-9.]+\s*%/g)
  if (toleranceString){
    tolerance = toleranceString[0].match(/[0-9.]+/g)[0]
  }

  return [value, tolerance]
}

var Resistor = function(value, tolerance, bands, maxSeries, useRealValues, fiveBand) {
  var closestRealValue = function(value, maxSeries, fiveBand){
    var seriesToSliceIndex = {E12: 1, E24: 2, E48: 3, E96: 4}
    var sliceIndex = seriesToSliceIndex[maxSeries.toUpperCase()]
    var allValues = SearchValues.slice(0, sliceIndex)[sliceIndex - 1]
    return fiveBand == 'true' ? Math.max(1.0, findNearestNumericalMatch(allValues, value)) : findNearestNumericalMatch(allValues, value)
  }

  var sanitizeValue = function(resistorFloat, fiveBand){
    var resistorFloatString = resistorFloat.toString()
    var santitizedString = '';
    if (fiveBand == 'true'){ // I hate this stupid hack
      var x = 4
    } else {
      var x = 3
    }
    for (var i = 0; i < resistorFloatString.length; i++) {
      var digit = resistorFloatString.charAt(i)
      if ((santitizedString.match(/[0-9]/g) || []).length < (resistorFloat < 1 ? x : x - 1)) {
        santitizedString += digit
      } else if (digit.match(/[0-9]/g)) {
        santitizedString += '0'
      } else {
        santitizedString += digit
      }
    }
    var output = parseFloat(santitizedString)
    output = fiveBand == 'true' ? Math.max(1.0, output) : Math.max(0.1, output)
    output = fiveBand == 'true' ? Math.min(output, 999000000) : Math.min(output, 990000000)
    return output
  }

  var earliestSeries = function(value) {
    var searchTuples = [[E12, 'E12'], [E24, 'E24'], [E48, 'E48'], [E96, 'E96']]
    for (var i = 0; i < searchTuples.length; i++){
      if (searchTuples[i][0].indexOf(value) >= 0){
        return searchTuples[i][1]
      }
    }
  }

  // returns user-provided tolerance if it's valid, otherwise returns the highest tolerance
  var pickTolerance = function(value, tolerance, availableTolerances){
    if (tolerance && (availableTolerances.indexOf(tolerance) >= 0)) { 
      return tolerance
    } else {
      return availableTolerances[0]
    }
  }

  var getBands = function(value, tolerance, fiveBand){
    var bands = []
    var stringValue = value.toString();

    // determine base value
    var digitMatches = stringValue.replace(/0\./g,'').match(/[0-9]/g)
    bands.push(digitMatches[0])
    bands.push(digitMatches[1] || '0')
    if (digitMatches[2] && digitMatches[2] != '0'){
      bands.push(digitMatches[2])
    }

    // determine multiplier. this could be DRYd up a bit but I'm leaving it open for readability
    if (bands.length == 3 || fiveBand == 'true') {
      if (value >= 100) {
        bands.push((Math.pow(10, stringValue.length - 3)).toString())
      } else {
        bands.push((Math.pow(10, Math.floor(value).toString().length - 3)).toString()) // 3 - number of digits to the decimal
      }
    } else {
      if (value >= 10) {
        bands.push((Math.pow(10, stringValue.length - 2)).toString())
      } else if (value >= 1) {
        bands.push((Math.pow(10, Math.floor(value).toString().length - 2)).toString()) // 2 - number of digits to the decimal
      } else {
        bands.push((Math.pow(10, -2)).toString())
      }
    }

    // add tolerance
    bands.push((tolerance || '').toString())

    return bands;
  }

  var valueFromBands = function(bands){
    var multiplier = parseFloat(bands[bands.length - 2])
    var baseValueString = bands[0].toString() + bands[1].toString()
    if (bands.length == 5) {
      baseValueString = baseValueString + bands[2].toString()
    }
    return parseInt(baseValueString) * multiplier
  }

  maxSeries = maxSeries || 'E96'
  useRealValues = useRealValues || 'true'
  this.realValue = useRealValues == 'true'
  fiveBand = fiveBand || 'false'
  if (value) {
    if (useRealValues == 'true') { // this isn't in use in the application, but I figure it's worth keeping in here
      this.value = closestRealValue(value, maxSeries, fiveBand)
      this.series = earliestSeries(this.value)
      this.tolerance = pickTolerance(this.value, tolerance, this.availableTolerances())
    } else {
      this.value = sanitizeValue(value, fiveBand)
      this.closestResistor = new Resistor(closestRealValue(this.value, maxSeries, fiveBand), tolerance, null, this.maxSeries, 'true', fiveBand)
      this.tolerance = tolerance ? findNearestNumericalMatch([10, 5, 2, 1], parseInt(tolerance)).toString() : null
    }
    this.bands = getBands(this.value, this.tolerance, fiveBand)
  } else if (bands) {
    this.value = valueFromBands(bands)
    this.series = earliestSeries(this.value)
    this.tolerance = bands[bands.length - 1]
    this.bands = getBands(this.value, this.tolerance, fiveBand)
    this.closestResistor = new Resistor(closestRealValue(this.value, maxSeries, fiveBand), tolerance, null, this.maxSeries, 'true', fiveBand)
  } else {
    throw('Could not initialize.')
  }
}

Resistor.prototype.availableTolerances = function() {
  var tolerances = []
  if (this.realValue){
    var searchTuples = [[E12, '10'], [E24, '5'], [E48, '2'], [E96,'1']]
    for (var i = 0; i < searchTuples.length; i++){
      if (searchTuples[i][0].indexOf(this.value) >= 0){
        tolerances.push(searchTuples[i][1])
      }
    }
  } else {
    tolerances = ['10', '5', '2', '1']
  }
  return tolerances
}

Resistor.prototype.getValueString = function(){
  var valueString = this.value.toString()
  var digitsUntilDecimal = valueString.match(/[0-9]+/g)[0].length
  if (digitsUntilDecimal <= 3){
    return valueString
  } else if (digitsUntilDecimal >= 4 && digitsUntilDecimal <= 6) {
    var formattedString = valueString.slice(0,digitsUntilDecimal-3) + '.' + valueString.slice(digitsUntilDecimal-3).replace(/0{1,3}$/, '')
    return formattedString.replace(/\.$/, '') + 'k'
  } else {
    var formattedString = valueString.slice(0,digitsUntilDecimal-6) + '.' + valueString.slice(digitsUntilDecimal-6).replace(/0{1,6}$/, '')
    return formattedString.replace(/\.$/, '') + 'M'
  }
}
