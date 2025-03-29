"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

require("./Field.css");

var _ClientApiContext = require("../contexts/ClientApiContext");

var _react = require("react");

function Field(probs) {
  var clientApi = (0, _react.useContext)(_ClientApiContext.ClientApiContext);
  var canvasRef = (0, _react.useRef)(null);

  var drawFigures = function drawFigures(figures) {
    var canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = figures[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var figure = _step.value;
        if (figure.points.length === 0) continue;
        ctx.beginPath();
        ctx.moveTo(figure.points[0].x, figure.points[0].y);

        for (var i = 1; i < figure.points.length; i++) {
          ctx.lineTo(figure.points[i].x, figure.points[i].y);
        }

        ctx.closePath();
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillstyle = figure.color;
        ctx.fill();
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  };

  (0, _react.useEffect)(function () {
    clientApi.callback = drawFigures;
    return function () {
      clientApi.callback = function (data) {};
    };
  }, [clientApi]);
}

var _default = Field;
exports["default"] = _default;