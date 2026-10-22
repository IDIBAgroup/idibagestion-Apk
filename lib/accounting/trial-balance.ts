export function signedAccountBalance(debitCents: bigint, creditCents: bigint) {
  return debitCents - creditCents;
}

export function splitAccountBalance(netCents: bigint) {
  return {
    debitCents: netCents > 0n ? netCents : 0n,
    creditCents: netCents < 0n ? -netCents : 0n,
  };
}

export function getClosingAccountBalance(openingNetCents: bigint, periodDebitCents: bigint, periodCreditCents: bigint) {
  return openingNetCents + signedAccountBalance(periodDebitCents, periodCreditCents);
}
