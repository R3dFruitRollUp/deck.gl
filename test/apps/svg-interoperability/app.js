/* global document, window,*/
/* eslint-disable no-console */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import DeckGL, {COORDINATE_SYSTEM, ScatterplotLayer, OrthographicView} from 'deck.gl';
import ContourLayer from '@deck.gl/layers/contour-layer/contour-layer';

const DEGREE_TO_RADIAN = Math.PI / 180;
const NUM_POINTS = 20000;
const VIEW_MODE = {
  WEBGL: 0,
  SVG: 1,
  HYBRID: 2
};

class Root extends PureComponent {
  constructor(props) {
    super(props);

    this._onResize = this._onResize.bind(this);
    this._onClick = this._onClick.bind(this);
    this._update = this._update.bind(this);
    this._onContourToggle = this._onContourToggle.bind(this);

    const points = Array.from(Array(NUM_POINTS)).map((_, i) => {
      return {
        radius: Math.random(),
        theta: Math.random() * 360
      };
    });

    this.state = {
      width: 0,
      height: 0,
      viewMode: VIEW_MODE.WEBGL,
      points
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this._onResize);
    this._onResize();
    window.requestAnimationFrame(this._update);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._onResize);
  }

  _onResize() {
    const {innerWidth: width, innerHeight: height} = window;
    this.setState({width, height});
  }

  _onClick() {
    let nextViewMode;

    switch (this.state.viewMode) {
      case VIEW_MODE.WEBGL:
        nextViewMode = VIEW_MODE.SVG;
        break;
      case VIEW_MODE.SVG:
        nextViewMode = VIEW_MODE.HYBRID;
        break;
      case VIEW_MODE.HYBRID:
        nextViewMode = VIEW_MODE.WEBGL;
        break;
      default:
        nextViewMode = VIEW_MODE.WEBGL;
    }

    this.setState({viewMode: nextViewMode});
  }

  _onContourToggle() {
    const renderContours = !this.state.renderContours;
    this.setState({renderContours});
  }

  _update() {
    const {points} = this.state;
    const newPoints = points.map(point => {
      point.theta += Math.sqrt(point.radius);
      return point;
    });
    this.setState({points: newPoints});

    this.forceUpdate();
    window.requestAnimationFrame(this._update);
  }

  _renderSVGPoints() {
    const {width, height, points} = this.state;
    const size = Math.min(width, height) / 2;

    return (
      <g transform={`translate(${size}, ${size})`}>
        {points &&
          points.length &&
          points.map((p, i) => (
            <circle
              key={i}
              r={2}
              fill="#08F"
              cx={p.radius * Math.cos(p.theta * DEGREE_TO_RADIAN) * size}
              cy={p.radius * Math.sin(p.theta * DEGREE_TO_RADIAN) * size}
            />
          ))}
      </g>
    );
  }

  _renderScatterplotLayer() {
    const {width, height, points} = this.state;
    const size = Math.min(width, height) / 2;

    return new ScatterplotLayer({
      id: 'scatterplot-layer',
      data: points,
      getPosition: p => [
        p.radius * Math.cos(p.theta * DEGREE_TO_RADIAN) * size,
        p.radius * Math.sin(p.theta * DEGREE_TO_RADIAN) * size
      ],
      getRadius: p => 2,
      getColor: p => [255, 0, 128, 196],
      coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
      // there's a bug that the radius calculated with project_scale
      radiusMinPixels: 2
    });
  }

  _renderContourLayer() {
    const {width, height, points} = this.state;
    const size = Math.min(width, height) / 2;

    return new ContourLayer({
      id: 'contour-layer',
      data: points,
      getPosition: p => [
        p.radius * Math.cos(p.theta * DEGREE_TO_RADIAN) * size,
        p.radius * Math.sin(p.theta * DEGREE_TO_RADIAN) * size
      ],
      coordinateSystem: COORDINATE_SYSTEM.IDENTITY,
      cellSize: 20,
      contours: [
        {threshold: 2, color: [0, 250, 250], strokeWidth: 6},
        {threshold: 25, color: [0, 150, 150], strokeWidth: 5},
        {threshold: 50, color: [0, 100, 100], strokeWidth: 4}
      ],
      gpuAggregation: true
    });
  }

  render() {
    const {width, height, viewMode, renderContours} = this.state;
    const left = -Math.min(width, height) / 2;
    const top = -Math.min(width, height) / 2;
    const view = new OrthographicView({width, height, left, top});

    return (
      width &&
      height && (
        <div>
          {(viewMode === VIEW_MODE.SVG || viewMode === VIEW_MODE.HYBRID) && (
            <svg viewBox={`0 0 ${width} ${height}`}>{this._renderSVGPoints()}</svg>
          )}
          {(viewMode === VIEW_MODE.WEBGL || viewMode === VIEW_MODE.HYBRID) && (
            <DeckGL
              width={width}
              height={height}
              views={view}
              style={{position: 'absolute', top: '0px', left: '0px'}}
              layers={[
                this._renderScatterplotLayer(),
                renderContours && this._renderContourLayer()
              ]}
            />
          )}
          <button style={{position: 'absolute', top: '8px', left: '8px'}} onClick={this._onClick}>
            switch
          </button>
          <button
            style={{position: 'absolute', top: '8px', left: '100px'}}
            onClick={this._onContourToggle}
          >
            Toggle Contours
          </button>
        </div>
      )
    );
  }
}

const root = document.createElement('div');
document.body.appendChild(root);

render(<Root />, root);
