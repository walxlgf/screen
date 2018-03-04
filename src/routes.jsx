import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Screen from './containers/screen';

export default class Routes extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <Router>
                    <Switch>
                        <Route exact path='/' component={Screen} />
                    </Switch>
                </Router>
            </div>
        )
    }
}


