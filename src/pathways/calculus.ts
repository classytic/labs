import type { LabPathway } from './types.js';

export const calculusPathway: LabPathway = {
  id: 'calculus-foundations',
  title: 'Calculus: from approach to approximation',
  description:
    'A coherent visual sequence from limits through derivatives and accumulation to approximation, differential equations, optimization, and solving.',
  domain: 'math',
  grades: ['11', '12'],
  estimatedMinutes: 133,
  steps: [
    {
      id: 'limit-explorer',
      tag: 'LimitExplorer',
      title: 'Approach and continuity',
      purpose: 'Build the limiting process before introducing instantaneous change.',
      defaultAttributes: { equation: '(x^2 - 1)/(x - 1)', xRange: [-1, 3], c: 1 },
    },
    {
      id: 'derivative-explorer',
      tag: 'DerivativeExplorer',
      title: 'Secant becomes tangent',
      purpose: 'Interpret the derivative as a limit and an instantaneous rate.',
      defaultAttributes: { equation: '0.15*x^3 - x', xRange: [-4, 4], startX: 1 },
    },
    {
      id: 'integral-explorer',
      tag: 'IntegralExplorer',
      title: 'Rectangles become accumulation',
      purpose: 'Construct signed area through increasingly fine partitions.',
      defaultAttributes: { equation: '0.4*x^2 + 0.5', xRange: [-1, 4], a: 0, b: 3, n: 8 },
    },
    {
      id: 'fundamental-theorem',
      tag: 'FundamentalTheorem',
      title: 'Accumulation becomes slope',
      purpose: 'Connect integration and differentiation through synchronized graphs.',
      defaultAttributes: { equation: '0.5*x^2 - 1', xRange: [-3, 4], anchor: -1, startX: 2 },
    },
    {
      id: 'taylor-series',
      tag: 'TaylorSeries',
      title: 'Local derivatives become approximation',
      purpose: 'Assemble derivative information into a polynomial and inspect its error.',
      defaultAttributes: { equation: 'sin(x)', xRange: [-6.3, 6.3], center: 0, order: 5 },
    },
    {
      id: 'differential-equation',
      tag: 'DifferentialEquation',
      title: 'Local rates become trajectories',
      purpose: 'Follow a direction field and compare numerical initial-value solvers.',
      defaultAttributes: {
        equation: 'x - y',
        xRange: [-3, 3],
        yRange: [-3, 3],
        initial: [0, 1],
        stepSize: 0.4,
      },
    },
    {
      id: 'phase-portrait',
      tag: 'PhasePortrait',
      title: 'Coupled rates become a flow',
      purpose: 'Read a two-variable system as a vector field and explore its state-space trajectories.',
      defaultAttributes: { dx: 'y', dy: '-x - 0.25*y', xRange: [-4, 4], yRange: [-4, 4], initial: [3, 0] },
    },
    {
      id: 'gradient-descent',
      tag: 'GradientDescent',
      title: 'Gradients drive optimization',
      purpose: 'Use multivariable derivatives to minimize a loss surface.',
      defaultAttributes: { equation: 'x^2 + 2*y^2', range: [-3, 3], start: [2.4, 1.8], learningRate: 0.1 },
    },
    {
      id: 'newton-method',
      tag: 'NewtonMethod',
      title: 'Tangents solve equations',
      purpose: 'Turn local linearization into a guarded numerical root solver.',
      defaultAttributes: { equation: 'x^3 - x - 2', xRange: [-3, 3], startX: 1.8, maxSteps: 12 },
    },
  ],
};
