
// Spline-based random walk generator that stays within a polygon
// Requires turf.js for geometric operations
import * as turf from "@turf/turf";
class SplineRandomWalk {
    constructor(polygon, origin, destination, options = {}) {
        this.polygon = polygon;
        this.origin = origin;
        this.destination = destination;
        
        // Default options
        this.options = {
            maxSteps: options.maxSteps || 20,
            stepSize: options.stepSize || 0.1,
            smoothness: options.smoothness || 0.3,
            maxAttempts: options.maxAttempts || 100,
            splinePoints: options.splinePoints || 50,
            ...options
        };
    }
    
    // Generate a random walk path using splines
    generatePath() {
        const controlPoints = this.generateControlPoints();
        if (!controlPoints) {
            throw new Error('Could not generate valid path within polygon');
        }
        
        return this.createSplinePath(controlPoints);
    }
    
    // Generate control points for the spline that stay within the polygon
    generateControlPoints() {
        let attempts = 0;
        
        while (attempts < this.options.maxAttempts) {
            const points = [this.origin];
            let currentPoint = [...this.origin];
            let valid = true;
            
            // Generate intermediate random points
            for (let i = 0; i < this.options.maxSteps; i++) {
                const progress = (i + 1) / (this.options.maxSteps + 1);
                
                // Bias towards destination as we progress
                const biasStrength = progress * 0.7;
                const randomStrength = 1 - biasStrength;
                
                // Calculate biased direction towards destination
                const dx = this.destination[0] - currentPoint[0];
                const dy = this.destination[1] - currentPoint[1];
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.options.stepSize) {
                    break; // Close enough to destination
                }
                
                // Generate random direction
                const randomAngle = Math.random() * 2 * Math.PI;
                const randomX = Math.cos(randomAngle) * this.options.stepSize * randomStrength;
                const randomY = Math.sin(randomAngle) * this.options.stepSize * randomStrength;
                
                // Bias towards destination
                const biasX = (dx / distance) * this.options.stepSize * biasStrength;
                const biasY = (dy / distance) * this.options.stepSize * biasStrength;
                
                // Combine random and biased movement
                const nextPoint = [
                    currentPoint[0] + randomX + biasX,
                    currentPoint[1] + randomY + biasY
                ];
                
                // Check if the line segment from current to next point stays within polygon
                const lineSegment = turf.lineString([currentPoint, nextPoint]);
                
                if (!this.isPathInPolygon(lineSegment)) {
                    valid = false;
                    break;
                }
                
                points.push(nextPoint);
                currentPoint = nextPoint;
            }
            
            // Add destination point
            if (valid) {
                // Check final segment to destination
                const finalSegment = turf.lineString([currentPoint, this.destination]);
                if (this.isPathInPolygon(finalSegment)) {
                    points.push(this.destination);
                    return points;
                }
            }
            
            attempts++;
        }
        
        return null; // Failed to generate valid path
    }
    
    // Check if a path segment stays within the polygon
    isPathInPolygon(lineSegment) {
        try {
            // Check if line intersects polygon boundary (bad)
            const polygonLine = turf.polygonToLine(this.polygon);
            if (turf.booleanIntersects(lineSegment, polygonLine)) {
                return false;
            }
            
            // Check if all points are within polygon (good)
            const coords = turf.getCoords(lineSegment);
            for (const coord of coords) {
                if (!turf.booleanPointInPolygon(turf.point(coord), this.polygon)) {
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }
    
    // Create smooth spline path from control points
    createSplinePath(controlPoints) {
        if (controlPoints.length < 2) {
            return controlPoints;
        }
        
        const splinePoints = [];
        const numSegments = controlPoints.length - 1;
        const pointsPerSegment = Math.floor(this.options.splinePoints / numSegments);
        
        for (let i = 0; i < numSegments; i++) {
            const p0 = controlPoints[Math.max(0, i - 1)];
            const p1 = controlPoints[i];
            const p2 = controlPoints[i + 1];
            const p3 = controlPoints[Math.min(controlPoints.length - 1, i + 2)];
            
            for (let t = 0; t < pointsPerSegment; t++) {
                const u = t / pointsPerSegment;
                const point = this.catmullRomSpline(p0, p1, p2, p3, u);
                splinePoints.push(point);
            }
        }
        
        // Ensure we end exactly at the destination
        splinePoints.push(this.destination);
        
        return splinePoints;
    }
    
    // Catmull-Rom spline interpolation
    catmullRomSpline(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;
        
        const x = 0.5 * (
            (2 * p1[0]) +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
        );
        
        const y = 0.5 * (
            (2 * p1[1]) +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
        );
        
        return [x, y];
    }
    
    // Get path length
    getPathLength(path) {
        let length = 0;
        for (let i = 1; i < path.length; i++) {
            const dx = path[i][0] - path[i-1][0];
            const dy = path[i][1] - path[i-1][1];
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }
}

// Example usage:
export function generateRandomWalkInPolygon(polygon, origin, destination, options = {}) {
    // Create turf polygon from coordinates
    // const polygon = turf.polygon([polygonCoords]);
    
    // Create random walk generator
    const walker = new SplineRandomWalk(polygon, origin, destination, options);
    
    // Generate the path
    try {
        const path = walker.generatePath();
        return {
            success: true,
            path: path,
            length: walker.getPathLength(path)
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            path: null
        };
    }
}