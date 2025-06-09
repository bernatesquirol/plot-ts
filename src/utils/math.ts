import * as math from "mathjs"
// function makeGaussian(amplitude:number, x0:number, y0:number, sigmaX:number, sigmaY:number) {
//     return function(amplitude:number, x0:number, y0:number, sigmaX:number, sigmaY:number, x, y:number) {
//         var exponent = -(
//                 ( Math.pow(x - x0, 2) / (2 * Math.pow(sigmaX, 2)))
//                 + ( Math.pow(y - y0, 2) / (2 * Math.pow(sigmaY, 2)))
//             );
//         return amplitude * Math.pow(Math.E, exponent);
//     }.bind(null, amplitude, x0, y0, sigmaX, sigmaY);
// }
// function multivariateNormal(mean:any, covArray:any) {
//     const n = mean.length;
//     const cov = math.matrix(covArray);
//     math.det(cov)
//     math.sqrt(math.det(cov));
//     (math.sqrt(2*math.PI)**n * math.sqrt(math.det(cov)));
//     return {
//       // Probability Density Function
//       pdf: x => {
//         const c = 1 / (Math.pow(math.sqrt(2*math.pi) as any,n) * math.sqrt(math.det(cov) as number ));
//         return c * math.exp(
//           -(1/2) * math.multiply(
//             math.subtract(math.matrix(x), math.matrix(mean)),
//             math.inv(cov),
//             math.subtract(math.matrix(x), math.matrix(mean))
//           )
//         );
//       },
//       // Differential entropy
//       entropy: 0.5*math.log(math.det(cov)) + 0.5*n*(1 + math.log(2*math.PI)),
//       // Generate n samples using Cholesky Decomposition
//       sample: n_samples => Array(n_samples).fill().map(_ => {
//         const L = choleskyDecomposition(cov);
//         const z = boxMuller(n);
//         return math.add(
//           math.matrix(mean),
//           math.multiply(cov, math.matrix(z))
//         ).toArray();
//       }),
//     };
//   }