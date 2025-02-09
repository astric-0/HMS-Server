export const CheckIfBackwardsPath = (...path: string[]) => {
  return path.some((val) => val.includes('..'));
};
