import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { FooType } from '../../types/ExampleType';

// We import all of the styles in the corresponding .module.css file.
// Alternatively, you can use inline styling or styled components for your components.
import styles from './ExampleComponent.module.css';
import sharedStyles from '../shared/Shared.module.css';

// Specific props for this component
type CustomProps = {
    foo: FooType
}

// Combining the props from the router and the component props
type Props = RouteComponentProps & CustomProps

// State type for this component
type State = {
    bar: string;
}

// This is a class component, which means that it has a constructor and a state object.
// Alternatively, you can use functional components https://reactjs.org/docs/components-and-props.html#functional-and-class-components
class ExampleComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            bar: "defaultValue"
        }
    }

    render() {
        return (
            // You can assign a class to an element like this
            <div className={styles.ExampleClass}>
                {/* And assign multiple like this */}
                <div className={`${styles.ExampleClass} ${sharedStyles.SharedClass}`}>
                    Make cool shit :)
                </div>
            </div>
        )
    }
}

// Wrapping the component in the withRouter gives us access to the history object
export default withRouter(ExampleComponent);