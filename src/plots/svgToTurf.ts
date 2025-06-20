/**
 * SVG to Turf LineString Parser
 * Handles transformations, nested elements, and various SVG path formats
 */

export class SVGToTurfParser {
    constructor() {
        this.transformationMatrix = [1, 0, 0, 1, 0, 0]; // Identity matrix
    }

    /**
     * Parse SVG element and return Turf LineString features
     * @param {Element|string} svgInput - SVG element or SVG string
     * @returns {Object[]} Array of Turf LineString features
     */
    parse(svgInput) {
        let svgElement;

        if (typeof svgInput === 'string') {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgInput, 'image/svg+xml');
            svgElement = doc.documentElement;
        } else {
            svgElement = svgInput;
        }

        const features = [];
        this.parseElement(svgElement, features, [1, 0, 0, 1, 0, 0]);
        return features;
    }

    /**
     * Recursively parse SVG elements
     * @param {Element} element - Current SVG element
     * @param {Object[]} features - Array to collect features
     * @param {number[]} parentTransform - Parent transformation matrix
     */
    parseElement(element, features, parentTransform) {
        // Calculate current transformation matrix
        const currentTransform = this.combineTransforms(
            parentTransform,
            this.parseTransform(element.getAttribute('transform') || '')
        );

        // Handle different SVG elements that can contain line data
        const tagName = element.tagName.toLowerCase();

        switch (tagName) {
            case 'path':
                this.parsePath(element, features, currentTransform);
                break;
            case 'line':
                this.parseLine(element, features, currentTransform);
                break;
            case 'polyline':
                this.parsePolyline(element, features, currentTransform);
                break;
            case 'polygon':
                this.parsePolygon(element, features, currentTransform);
                break;
            case 'rect':
                this.parseRect(element, features, currentTransform);
                break;
            case 'circle':
            case 'ellipse':
                this.parseElliptical(element, features, currentTransform);
                break;
        }

        // Recursively process child elements
        for (const child of element.children) {
            this.parseElement(child, features, currentTransform);
        }
    }

    /**
     * Parse SVG path element
     */
    parsePath(element, features, transform) {
        const d = element.getAttribute('d');
        if (!d) return;

        const coordinates = this.parsePathData(d, transform);
        if (coordinates.length >= 2) {
            features.push(this.createLineStringFeature(coordinates, element));
        }
    }

    /**
     * Parse SVG line element
     */
    parseLine(element, features, transform) {
        const x1 = parseFloat(element.getAttribute('x1') || 0);
        const y1 = parseFloat(element.getAttribute('y1') || 0);
        const x2 = parseFloat(element.getAttribute('x2') || 0);
        const y2 = parseFloat(element.getAttribute('y2') || 0);

        const start = this.applyTransform([x1, y1], transform);
        const end = this.applyTransform([x2, y2], transform);

        features.push(this.createLineStringFeature([start, end], element));
    }

    /**
     * Parse SVG polyline element
     */
    parsePolyline(element, features, transform) {
        const points = element.getAttribute('points');
        if (!points) return;

        const coordinates = this.parsePoints(points, transform);
        if (coordinates.length >= 2) {
            features.push(this.createLineStringFeature(coordinates, element));
        }
    }

    /**
     * Parse SVG polygon element (converted to closed LineString)
     */
    parsePolygon(element, features, transform) {
        const points = element.getAttribute('points');
        if (!points) return;

        const coordinates = this.parsePoints(points, transform);
        if (coordinates.length >= 3) {
            // Close the polygon by adding the first point at the end
            if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
                coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
                coordinates.push([...coordinates[0]]);
            }
            features.push(this.createLineStringFeature(coordinates, element));
        }
    }

    /**
     * Parse SVG rect element (converted to closed LineString)
     */
    parseRect(element, features, transform) {
        const x = parseFloat(element.getAttribute('x') || 0);
        const y = parseFloat(element.getAttribute('y') || 0);
        const width = parseFloat(element.getAttribute('width') || 0);
        const height = parseFloat(element.getAttribute('height') || 0);

        const corners = [
            [x, y],
            [x + width, y],
            [x + width, y + height],
            [x, y + height],
            [x, y] // Close the rectangle
        ];

        const coordinates = corners.map(point => this.applyTransform(point, transform));
        features.push(this.createLineStringFeature(coordinates, element));
    }

    /**
     * Parse circle/ellipse elements (approximated as LineString)
     */
    parseElliptical(element, features, transform) {
        const cx = parseFloat(element.getAttribute('cx') || 0);
        const cy = parseFloat(element.getAttribute('cy') || 0);

        let rx, ry;
        if (element.tagName.toLowerCase() === 'circle') {
            const r = parseFloat(element.getAttribute('r') || 0);
            rx = ry = r;
        } else {
            rx = parseFloat(element.getAttribute('rx') || 0);
            ry = parseFloat(element.getAttribute('ry') || 0);
        }

        // Approximate circle/ellipse with 36 points (10-degree intervals)
        const coordinates = [];
        for (let i = 0; i <= 36; i++) {
            const angle = (i * 10) * Math.PI / 180;
            const x = cx + rx * Math.cos(angle);
            const y = cy + ry * Math.sin(angle);
            coordinates.push(this.applyTransform([x, y], transform));
        }

        features.push(this.createLineStringFeature(coordinates, element));
    }

    /**
     * Parse SVG path data attribute
     */
    parsePathData(pathData, transform) {
        const coordinates = [];
        const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];

        let currentPoint = [0, 0];
        let startPoint = [0, 0];

        for (const command of commands) {
            const type = command[0];
            const values = command.slice(1).trim().split(/[\s,]+/).filter(v => v).map(Number);

            switch (type.toLowerCase()) {
                case 'm': // moveto
                    if (type === 'm' && coordinates.length > 0) {
                        // Relative moveto
                        currentPoint = [currentPoint[0] + values[0], currentPoint[1] + values[1]];
                    } else {
                        // Absolute moveto
                        currentPoint = [values[0], values[1]];
                    }
                    startPoint = [...currentPoint];
                    coordinates.push(this.applyTransform(currentPoint, transform));
                    break;

                case 'l': // lineto
                    for (let i = 0; i < values.length; i += 2) {
                        if (type === 'l') {
                            // Relative lineto
                            currentPoint = [currentPoint[0] + values[i], currentPoint[1] + values[i + 1]];
                        } else {
                            // Absolute lineto
                            currentPoint = [values[i], values[i + 1]];
                        }
                        coordinates.push(this.applyTransform(currentPoint, transform));
                    }
                    break;

                case 'h': // horizontal lineto
                    const dx = type === 'h' ? values[0] : values[0] - currentPoint[0];
                    currentPoint[0] += dx;
                    coordinates.push(this.applyTransform(currentPoint, transform));
                    break;

                case 'v': // vertical lineto
                    const dy = type === 'v' ? values[0] : values[0] - currentPoint[1];
                    currentPoint[1] += dy;
                    coordinates.push(this.applyTransform(currentPoint, transform));
                    break;

                case 'z': // closepath
                    if (startPoint[0] !== currentPoint[0] || startPoint[1] !== currentPoint[1]) {
                        coordinates.push(this.applyTransform(startPoint, transform));
                    }
                    currentPoint = [...startPoint];
                    break;

                // For curves, we'll approximate with line segments
                case 'c': // cubic bezier
                    for (let i = 0; i < values.length; i += 6) {
                        const cp1 = type === 'c' ?
                            [currentPoint[0] + values[i], currentPoint[1] + values[i + 1]] :
                            [values[i], values[i + 1]];
                        const cp2 = type === 'c' ?
                            [currentPoint[0] + values[i + 2], currentPoint[1] + values[i + 3]] :
                            [values[i + 2], values[i + 3]];
                        const end = type === 'c' ?
                            [currentPoint[0] + values[i + 4], currentPoint[1] + values[i + 5]] :
                            [values[i + 4], values[i + 5]];

                        // Approximate curve with line segments
                        const curvePoints = this.approximateBezier(currentPoint, cp1, cp2, end, 10);
                        curvePoints.slice(1).forEach(point => {
                            coordinates.push(this.applyTransform(point, transform));
                        });
                        currentPoint = end;
                    }
                    break;
            }
        }

        return coordinates;
    }

    /**
     * Parse points attribute (for polyline/polygon)
     */
    parsePoints(pointsStr, transform) {
        const coords = pointsStr.trim().split(/[\s,]+/).map(Number);
        const coordinates = [];

        for (let i = 0; i < coords.length; i += 2) {
            if (i + 1 < coords.length) {
                coordinates.push(this.applyTransform([coords[i], coords[i + 1]], transform));
            }
        }

        return coordinates;
    }

    /**
     * Parse SVG transform attribute
     */
    parseTransform(transformStr) {
        if (!transformStr) return [1, 0, 0, 1, 0, 0];

        let matrix = [1, 0, 0, 1, 0, 0];
        const transforms = transformStr.match(/(\w+)\s*\([^)]*\)/g) || [];

        for (const transform of transforms) {
            const [, type, valuesStr] = transform.match(/(\w+)\s*\(([^)]*)\)/) || [];
            const values = valuesStr.split(/[\s,]+/).map(Number);

            switch (type) {
                case 'translate':
                    matrix = this.combineTransforms(matrix, [1, 0, 0, 1, values[0] || 0, values[1] || 0]);
                    break;
                case 'scale':
                    const sx = values[0] || 1;
                    const sy = values[1] || sx;
                    matrix = this.combineTransforms(matrix, [sx, 0, 0, sy, 0, 0]);
                    break;
                case 'rotate':
                    const angle = (values[0] || 0) * Math.PI / 180;
                    const cos = Math.cos(angle);
                    const sin = Math.sin(angle);
                    matrix = this.combineTransforms(matrix, [cos, sin, -sin, cos, 0, 0]);
                    break;
                case 'matrix':
                    if (values.length === 6) {
                        matrix = this.combineTransforms(matrix, values);
                    }
                    break;
            }
        }

        return matrix;
    }

    /**
     * Combine two transformation matrices
     */
    combineTransforms(m1, m2) {
        return [
            m1[0] * m2[0] + m1[2] * m2[1],
            m1[1] * m2[0] + m1[3] * m2[1],
            m1[0] * m2[2] + m1[2] * m2[3],
            m1[1] * m2[2] + m1[3] * m2[3],
            m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
            m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
        ];
    }

    /**
     * Apply transformation matrix to a point
     */
    applyTransform(point, matrix) {
        const [x, y] = point;
        return [
            matrix[0] * x + matrix[2] * y + matrix[4],
            matrix[1] * x + matrix[3] * y + matrix[5]
        ];
    }

    /**
     * Approximate cubic Bezier curve with line segments
     */
    approximateBezier(p0, p1, p2, p3, segments = 10) {
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const mt = 1 - t;
            const x = mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0];
            const y = mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1];
            points.push([x, y]);
        }
        return points;
    }

    /**
     * Create a Turf LineString feature
     */
    createLineStringFeature(coordinates, element) {
        const properties = {
            id: element.getAttribute('id') || undefined,
            class: element.getAttribute('class') || undefined,
            stroke: element.getAttribute('stroke') || undefined,
            strokeWidth: element.getAttribute('stroke-width') || undefined,
            fill: element.getAttribute('fill') || undefined
        };

        // Remove undefined properties
        Object.keys(properties).forEach(key => {
            if (properties[key] === undefined) delete properties[key];
        });

        return {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            },
            properties: properties
        };
    }
}
