export const checkIfBackwardsPath = (...path: string[]) => {
  return path.some((val) => val?.includes('..'));
};
