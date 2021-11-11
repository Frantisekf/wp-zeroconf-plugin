
import React, { Component } from 'react';
import Control from './../shared/Control';
import { Focusable, FocusableSection } from 'react-js-spatial-navigation';
import classes from './Discovery.module.css';

class Discovery extends Component {
    baseUrl = 'http://localhost:15051/a1/xploretv/v1/zeroconf';
    serviceName = 'TV Dashboard';
    state = {error: {code: 'Unknown', msg: 'Error', reason: 'Failed to fetch'}};
    loaded = 0;
    mainItems = [{key: 'ipv4', name: 'IPv4'}, {key: 'ipv6', name: 'IPv6'}, {key: 'port', name: 'Port'}, {key: 'name', name: 'Name'}, { key: 'domain', name: 'Domain'},
                 { key: 'host', name: 'Host'}, {key: 'type', name: 'Service Type'}, { key: 'subtype', name: 'Service Subtype'}]
    showRight = false;


    parseData(data){
        const services = {};
        data.forEach(service => {
            const node = {name: service.name, domain: service.domainName, host: service.hostName, ipv4: service.addresses.ipv4, ipv6: service.addresses.ipv6,
                          type: service.service.type, subtype: service.service.subtype, port: String(service.service.port), record: service.service.txtRecord};
            if (service.hostName in services){
                services[service.hostName].push(node);
            } else {
                services[service.hostName] = [node];
            }
        });
        if ('services' in this.state){
            this.setState({services: services});
        } else {
            this.setState({services: services, selIdx: 0, detailIdx: 0, error: false});
        }
    }

    requestServices(){
            fetch(this.baseUrl)
            .then(async res => {
                const resp = await res.json();
                if (!res.ok){
                    return this.setState({ error: { code: resp.code, msg: resp.message, reason: resp.reason, host: process.env.REACT_APP_DISCOVERY_URL } });
                }
                return this.parseData(resp.services);
            }).catch(error => {
                return this.setState({error: {code: 'Unknown', msg: 'Error', reason: error.message, host: process.env.REACT_APP_DISCOVERY_URL}});
            });
    }

    loadData() {
        // if (this.loaded === 0)
        // {
        //     fetch(this.baseUrl, {
        //     method: 'post',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(
        //         {
        //             name: this.serviceName,
        //             replaceWildcards: true,
        //             serviceProtocol: 'any',
        //             service: {
        //                 type: '_http._tcp',
        //                 port: parseInt(window.location.port),
        //                 txtRecord: {
        //                     version: '1.0',
        //                     provider: 'A1 Telekom Austria Group',
        //                     product: 'A1 Service Discovery',
        //                     path:  window.location.protocol + '//' + window.location.hostname + ':' + window.location.port,
        //                 }
        //             }
        //         }
        //     ) 
        //     })
        //     .then(response => response.json())
        //     .then(response => {
        //         if (response.code !== 201 && response.code !== 409){
        //             return this.setState({error: {code: response.code, msg: response.message, reason: response.reason, host: this.baseUrl}});
        //         }
        //         this.requestServices();
        //     })
        //     .catch(error => {
        //         return this.setState({error: {code: 'Unknown', msg: 'Error', reason: error.message, host: this.baseUrl}});
        //     })
        // } else {
            this.requestServices();
        
        
    }

    componentDidMount(){
            this.loadData();
            this.loaded = Date.now();
        }

    changeIdx = (event, idx) => {
        if ('services' in this.state){
            this.showRight = false;
            this.setState({selIdx: idx, detailIdx: 0});
            event.target.scrollIntoView({behavior: 'smooth', inline: 'center', block: 'center'});
        }
    }

    changeDetailIdx = (event, idx) => {
        if ('services' in this.state){
            this.showRight = true;
            this.setState({detailIdx: idx});
            event.target.scrollIntoView({behavior: 'smooth', inline: 'center', block: 'center'});
        }
    }

    getNodes(){
        if ('services' in this.state){
            return (Object.keys(this.state.services).map((key, idx) => {
                return(
                    <Focusable className={classes.Row + (idx === 0 ? ' menu-active' : '')} key={idx}
                        onFocus={(event) => this.changeIdx(event, idx)}
                        onKeyUp={(event) => this.props.hideMenu(event)}>
                        <p className={classes.Name}>{this.state.services[key][0].host.replace(/(.local.$|.$)/i, '')}</p>
                        <p className={classes.Address}>{this.state.services[key][0].ipv4[0]}
                        <span className={classes.Number}> ({this.state.services[key].length === 1 ? 'One service' : this.state.services[key].length + ' services'})</span>
                        </p>
                    </Focusable>
                )
            })
            )
        }
    }

    getServices(){
        if ('services' in this.state){
            let index = this.state.selIdx;
            if (this.state.selIdx > Object.keys(this.state.services).length) {
                index = 0;
            }

            const service = this.state.services[Object.keys(this.state.services)[index]];
            return (
                <>
                    <p className={classes.Address}>Address</p>
                    <p className={classes.Name}>{service[0].host}</p>
                    {service[0].ipv4.map((ip, idx) => {
                        return(<p key={'ipv4-' + idx} className={classes.Name}>{ip}</p>)
                    })}
                    {service[0].ipv6.map((ip, idx) => {
                        return(<p key={'ipv6-' + idx} className={classes.Name}>{ip}</p>)
                    })}
                    <div className={classes.InfoWrap}>
                        <p className={classes.Address}>Services</p>
                        {service.map((ser, idx) => {
                            return(
                                <Focusable className={classes.InfoRow} key={idx}
                                    onFocus={(event) => this.changeDetailIdx(event, idx)}
                                    onKeyUp={(event) => this.props.hideMenu(event)}>
                                    <p className={classes.Name}>{ser.name}</p>
                                    <p className={classes.Type}>{ser.type}</p>
                                </Focusable>
                            )
                        })}
                    </div>
                </>
            )
        }
    }

    getLink(service, ip){
        let url = "";
        if (service.record['get'] && service.record['get'].startsWith('http')){
            url = service.record['get'];
        } else {
            url = 'http://' + ip + ':' + String(service['port']) + (service.record['get'] ? service.record['get'] : '');
        }
        return url;
    }

    getButton(service){
        if (service['type'].includes('http')){
            return(service['ipv4'].map((ip, idx) => {
                const urltest = this.getLink(service, ip)
                return(
                    <div className={classes.BtnWrap} key={'open_btn-' + idx}>
                        <Focusable className={classes.Btn} onClick={() => {window.location = urltest; window.history.go(-1)}}>
                            {service['ipv4'].length > 1 ? 'Open (' + idx +')': 'Open'}
                        </Focusable>
                    </div>
                )
            }))
        }
    }

    getDetailValue(service, item){
        if (Array.isArray(service[item.key])){
            return (service[item.key].map((it, idx) => {
                return(<p key={item.key + '-' + idx} className={classes.InfoValue}>{it}</p>)
            }))
        } else {
            return(<p className={classes.InfoValue}>{service[item.key]}</p>)
        }
    }

    getServiceDetail(){
        if ('services' in this.state){
            let index = this.state.detailIdx;
            if (this.state.services[Object.keys(this.state.services)[this.state.selIdx]].length < index + 1){
                index = 0;
                return
            }

            const service = this.state.services[Object.keys(this.state.services)[this.state.selIdx]][index];
            return(
                <FocusableSection sectionId='detail-service'
                    neighborUp=''
                    neighborDown=''
                    neighborLeft='@detail-services'
                    neighborRight=''
                    className={classes.RightPanel + ' ' + (this.showRight ? classes.Show : classes.Hide)}>
                        <div className={classes.Frame}>
                            {this.getButton(service)}
                            <p className={classes.InfoTitle}>Core</p>
                            {this.mainItems.map((item, idx) => {
                                if (service[item.key] && service[item.key].length > 0){
                                    return(
                                        <Focusable className={classes.DetailRow} key={'detail_' + idx}
                                            onFocus={(event) => {event.target.scrollIntoView({behavior: 'smooth', inline: 'center', block: 'center'})}}>
                                            <p className={classes.InfoHead}>{item.name}</p>
                                            {this.getDetailValue(service, item)}
                                        </Focusable>
                                    )
                                } else return(null)
                            })}
                            <br></br>
                            <p className={classes.InfoTitle}>Data</p>
                            {Object.keys(service.record).map((item) => {
                                return(
                                    <Focusable className={classes.DetailRow} key={item}
                                        onFocus={(event) => {event.target.scrollIntoView({behavior: 'smooth', inline: 'center', block: 'center'})}}>
                                        <p className={classes.InfoHead}>{item}</p>
                                        <p className={classes.InfoValue}>{service.record[item]}</p>
                                    </Focusable>
                                )
                            })}
                        </div>
                </FocusableSection>
            )
        }
    }
    getMenu() {
        
            if (this.state.error !== false){
                return(
                        <div className={'modal-menu'} ref={this.props.modalRef}>
                            <div className={classes.ServiceWrap}>
                                <FocusableSection sectionId='main-service'
                                        className={classes.ErrorWrap}>
                                    <div className="Error-item">
                                        <img src={process.env.PUBLIC_URL + '../ws_error.svg'} alt="Error"/>
                                    </div>
                                    <div className="Error-item"><strong>Ups, da ist etwas schief gelaufen.</strong> Wahrscheinlich fehlt das Zeroconfiguration Networking Service. Bitte wenden Sie sich an den Gerätehersteller oder an Ihren Dienstanbieter.</div>
                                    <div className="Error-item"><strong>Ooops, something went wrong.</strong> Probably the Zeroconfiguration Networking Service is missing. Please contact the device manufacturer or your service provider.</div>
                                    <div className={classes.ErrorCode}><strong>Host:</strong> {this.state.error.host}</div>
                                    <div className={classes.ErrorCode}><strong>Code:</strong> {this.state.error.code}</div>
                                    <div className={classes.ErrorMsg}><strong>{this.state.error.msg}:</strong> {this.state.error.reason}</div>
                                </FocusableSection>
                            </div>
                        </div>
                )
            } else {
                return(
                <div>
                <h1 className={classes.Title}>Service Discovery</h1>
                <div className={classes.ServiceWrap}>
                    <FocusableSection sectionId='main-service'
                        neighborUp=''
                        neighborDown=''
                        neighborRight='@detail-services'
                        className={classes.LeftPanel}>
                            <div className={classes.Frame}>
                                <p className={classes.Address + ' ' + classes.TextCenter}>Hosts</p>
                                {this.getNodes()}
                            </div>
                    </FocusableSection>
                    <FocusableSection sectionId='detail-services'
                        neighborUp=''
                        neighborDown=''
                        neighborLeft='@main-service'
                        neighborRight='@detail-service'
                        className={classes.MidPanel}>
                            <div className={classes.Frame}>
                                {this.getServices()}
                            </div>
                    </FocusableSection>
                    {this.getServiceDetail()}
                </div>
            </div>
                )
            }
        }
    
    render(){
        return (
            this.getMenu()

        );
                     }
}

export default Discovery;