import { connect } from 'react-redux';
import { compose } from 'redux';
import { withTranslation } from 'react-i18next';
import { Utils } from 'manifesto.js/dist-esmodule/Utils';
import { withPlugins } from '../extend/withPlugins';
import * as actions from '../state/actions';
import {
  getAuth,
  getAuthProfiles,
  selectCurrentAuthServices,
  getAccessTokens,
} from '../state/selectors';
import { IIIFAuthentication } from '../components/IIIFAuthentication';

/**
 * mapStateToProps - to hook up connect
 * @memberof FullScreenButton
 * @private
 */
const mapStateToProps = (state, { windowId }) => {
  const services = selectCurrentAuthServices(state, { windowId });

  // TODO: get the most actionable auth service...
  const service = services[0];

  const accessTokenService = service && (
    Utils.getService(service, 'http://iiif.io/api/auth/1/token')
    || Utils.getService(service, 'http://iiif.io/api/auth/0/token')
  );
  const logoutService = service && (
    Utils.getService(service, 'http://iiif.io/api/auth/1/logout')
    || Utils.getService(service, 'http://iiif.io/api/auth/0/logout')
  );

  const authStatuses = getAuth(state);
  const authStatus = service && authStatuses[service.id];
  const accessTokens = getAccessTokens(state);
  const accessTokenStatus = accessTokenService && accessTokens[accessTokenService.id];

  let status = null;

  if (!authStatus) {
    status = null;
  } else if (authStatus.ok) {
    status = 'ok';
  } else if (authStatus.ok === false) {
    status = 'failed';
  } else if (authStatus.isFetching) {
    if (authStatus.windowId === windowId) status = 'cookie';
  } else if (accessTokenStatus && accessTokenStatus.isFetching) {
    if (authStatus.windowId === windowId) status = 'token';
  }

  const authProfiles = getAuthProfiles(state);

  const profile = service && service.getProfile();

  const isInteractive = authProfiles.some(
    config => config.profile === profile && !(config.external || config.kiosk),
  );

  return {
    accessTokenServiceId: accessTokenService && accessTokenService.id,
    authServiceId: service && service.id,
    confirm: service && service.getConfirmLabel(),
    description: service && service.getDescription(),
    failureDescription: service && service.getFailureDescription(),
    failureHeader: service && service.getFailureHeader(),
    header: service && service.getHeader(),
    isInteractive,
    label: service && service.getLabel()[0].value,
    logoutServiceId: logoutService && logoutService.id,
    profile,
    status,
  };
};

/**
 * mapDispatchToProps - used to hook up connect to action creators
 * @memberof ManifestListItem
 * @private
 */
const mapDispatchToProps = {
  handleAuthInteraction: actions.addAuthenticationRequest,
  resetAuthenticationState: actions.resetAuthenticationState,
  resolveAccessTokenRequest: actions.resolveAccessTokenRequest,
  resolveAuthenticationRequest: actions.resolveAuthenticationRequest,
};

const enhance = compose(
  withTranslation(),
  connect(mapStateToProps, mapDispatchToProps),
  withPlugins('IIIFAuthentication'),
);

export default enhance(IIIFAuthentication);
