// Harness stand-in for the HOST's shadcn/Base UI tooltip. Production resolves this
// import to the host component; package tests only need the trigger's DOM contract.
import { cloneElement, createElement, isValidElement } from 'react';

export function Tooltip({ children }) {
  return createElement('span', { 'data-slot': 'tooltip' }, children);
}

export function TooltipTrigger({ render, children, ...props }) {
  if (isValidElement(render)) return cloneElement(render, props);
  return createElement('button', { type: 'button', ...props }, children);
}

export function TooltipContent({ children, ...props }) {
  return createElement('span', { hidden: true, ...props }, children);
}

export function TooltipProvider({ children }) {
  return children;
}
