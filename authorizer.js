'use strict';

const generatePolicy = function(principalId, effect, resource) {
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  return authResponse;
};

module.exports.user = (event, context, callback) => {

  // Get Token
  if (typeof event.authorizationToken === 'undefined') {
    callback('Unauthorized');
  }

  const split = event.authorizationToken.split('Bearer');
  if (split.length !== 2) {
    callback('Unauthorized');
  }
  const token = split[1].trim();
  /*
   * extra custom authorization logic here: OAUTH, JWT ... etc
   * search token in database and check if valid
   * here for demo purpose we will just compare with hardcoded value
   */
   switch (token.toLowerCase()) {
    case "allow":
      callback(null, generatePolicy('user123', 'Allow', event.methodArn));
      break;
    case "deny":
      callback(null, generatePolicy('user123', 'Deny', event.methodArn));
      break;
    default:
      callback('Unauthorized');
   }

};
