import React, { useState } from 'react'
import { Form, FormCheck, Nav, Tab, Button } from 'react-bootstrap'
import Card from '../../../src/components/Card'
// import Nouislider from "nouislider-react"
// import "nouislider/distribute/nouislider.css"
// import "nouislider/distribute/nouislider.css";

// import "./colorpicker.css";

const ToggleBtns = () => {
    const [toggleState, setToggleState] = useState(true);

    return (
        <>
            <article id="toggle-btn">
                <div className="bd-heading sticky-xl-top align-self-start">
                    <Card>
                        <Card.Body>
                            <h5>Toggle Button</h5>
                            <div className="d-flex align-items-center mt-2">
                                <Button bsPrefix=" d-flex" href="https://templates.iqonic.design/hope-ui/documentation/react/build/toggle-button" target="_blank">
                                    <svg width="20" className="me-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12 21.2498C17.108 21.2498 21.25 17.1088 21.25 11.9998C21.25 6.89176 17.108 2.74976 12 2.74976C6.892 2.74976 2.75 6.89176 2.75 11.9998C2.75 17.1088 6.892 21.2498 12 21.2498Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <path d="M10.5576 15.4709L14.0436 11.9999L10.5576 8.52895" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                    </svg>
                                    <span>Documentation</span>
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
                <Card className=" iq-document-card">
                    <Tab.Container defaultActiveKey="first">
                        <div className="d-flex justify-content-end">
                            <Nav as="ul" className=" nav-tabs nav-tunnel nav-slider">
                                <Nav.Item as="li" role="presentation">
                                    <Nav.Link as="button" eventKey="first" className={toggleState === true ? "tabs active" : "tabs d-flex align-items-center"} onClick={() => setToggleState(true)} data-bs-toggle="tab" data-bs-target="#content-toggle-prv" type="button" role="tab" aria-controls="output" aria-selected="true">
                                        <svg width="20" className="me-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.4541 11.3918C22.7819 11.7385 22.7819 12.2615 22.4541 12.6082C21.0124 14.1335 16.8768 18 12 18C7.12317 18 2.98759 14.1335 1.54586 12.6082C1.21811 12.2615 1.21811 11.7385 1.54586 11.3918C2.98759 9.86647 7.12317 6 12 6C16.8768 6 21.0124 9.86647 22.4541 11.3918Z" stroke="currentColor" />
                                            <circle cx="12" cy="12" r="3.5" stroke="currentColor" />
                                            <circle cx="13.5" cy="10.5" r="1.5" fill="currentColor" />
                                        </svg>
                                        Preview
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item as="li" role="presentation">
                                    <Nav.Link as="button" eventKey="second" className={toggleState === false ? "tabs active-tabs" : "tabs d-flex align-items-center"} onClick={() => setToggleState(false)} data-bs-toggle="tab" data-bs-target="#content-toggle-code" type="button" role="tab" aria-controls="profile" aria-selected="false">
                                        <svg width="20" className="me-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4 2.00004C4 1.44776 4.44771 1.00004 5 1.00004L13.5721 1C13.8454 1 14.1068 1.11184 14.2955 1.30953L19.7234 6.99588C19.9009 7.18191 20 7.42919 20 7.68636V22C20 22.5523 19.5523 23 19 23H5C4.44772 23 4 22.5523 4 22V2.00004Z" stroke="currentColor" />
                                            <path d="M4 2C4 1.44772 4.44772 1 5 1H13C13.5523 1 14 1.44772 14 2V6.28566C14 6.83794 14.4477 7.28566 15 7.28566H19C19.5523 7.28566 20 7.73338 20 8.28566V22C20 22.5522 19.5523 23 19 23H5C4.44772 23 4 22.5522 4 22V2Z" stroke="currentColor" />
                                            <mask fill="white">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M7 14.5945L8.99429 12.1334C9.12172 11.9761 9.34898 11.9549 9.50189 12.0859C9.6548 12.217 9.67546 12.4507 9.54804 12.6079L7.93828 14.5945L9.54804 16.581C9.67546 16.7383 9.6548 16.972 9.50189 17.103C9.34898 17.2341 9.12172 17.2128 8.99429 17.0556L7 14.5945Z" />
                                            </mask>
                                            <path d="M7 14.5945L6.22306 13.9649L5.7129 14.5945L6.22306 15.2241L7 14.5945ZM8.99429 12.1334L9.77124 12.7629L9.77124 12.7629L8.99429 12.1334ZM9.50189 12.0859L8.85116 12.8452L8.85116 12.8452L9.50189 12.0859ZM9.54804 12.6079L10.325 13.2375L10.325 13.2375L9.54804 12.6079ZM7.93828 14.5945L7.16134 13.9649L6.65118 14.5945L7.16134 15.2241L7.93828 14.5945ZM9.54804 16.581L10.325 15.9515L10.325 15.9515L9.54804 16.581ZM9.50189 17.103L8.85116 16.3437L8.85116 16.3437L9.50189 17.103ZM8.99429 17.0556L8.21735 17.6852L8.21735 17.6852L8.99429 17.0556ZM10.1526 11.3266C9.5684 10.8259 8.69615 10.9129 8.21735 11.5038L9.77124 12.7629C9.54729 13.0393 9.12956 13.0838 8.85116 12.8452L10.1526 11.3266ZM10.325 13.2375C10.7905 12.663 10.7202 11.813 10.1526 11.3266L8.85116 12.8452C8.5894 12.6209 8.56045 12.2383 8.77109 11.9784L10.325 13.2375ZM8.71522 15.2241L10.325 13.2375L8.77109 11.9784L7.16134 13.9649L8.71522 15.2241ZM10.325 15.9515L8.71522 13.9649L7.16134 15.2241L8.77109 17.2106L10.325 15.9515ZM10.1526 17.8624C10.7202 17.3759 10.7905 16.5259 10.325 15.9515L8.77109 17.2106C8.56045 16.9507 8.5894 16.5681 8.85116 16.3437L10.1526 17.8624ZM8.21735 17.6852C8.69615 18.276 9.5684 18.363 10.1526 17.8624L8.85116 16.3437C9.12956 16.1052 9.5473 16.1497 9.77124 16.426L8.21735 17.6852ZM8.21735 11.5038L6.22306 13.9649L7.77694 15.2241L9.77124 12.7629L8.21735 11.5038ZM6.22306 15.2241L8.21735 17.6852L9.77124 16.426L7.77694 13.9649L6.22306 15.2241Z" fill="currentColor" mask="url(#path-3-inside-1)" />
                                            <path fillRule="evenodd" clipRule="evenodd" d="M13.771 11.1638C13.9576 11.2542 14.0356 11.4769 13.9451 11.6611L10.9973 17.6664C10.9069 17.8506 10.6823 17.9267 10.4957 17.8363C10.3091 17.7458 10.2311 17.5232 10.3215 17.3389L13.2693 11.3336C13.3598 11.1494 13.5844 11.0733 13.771 11.1638Z" fill="currentColor" />
                                            <mask fill="white">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M17 14.5945L15.0057 17.0556C14.8783 17.2128 14.651 17.2341 14.4981 17.103C14.3452 16.972 14.3245 16.7383 14.452 16.581L16.0617 14.5945L14.452 12.6079C14.3245 12.4507 14.3452 12.217 14.4981 12.0859C14.651 11.9549 14.8783 11.9761 15.0057 12.1334L17 14.5945Z" />
                                            </mask>
                                            <path d="M17 14.5945L17.7769 15.2241L18.2871 14.5945L17.7769 13.9649L17 14.5945ZM15.0057 17.0556L14.2288 16.426L14.2288 16.426L15.0057 17.0556ZM14.4981 17.103L15.1488 16.3437L15.1488 16.3437L14.4981 17.103ZM14.452 16.581L13.675 15.9515L13.675 15.9515L14.452 16.581ZM16.0617 14.5945L16.8387 15.2241L17.3488 14.5945L16.8387 13.9649L16.0617 14.5945ZM14.452 12.6079L13.675 13.2375L13.675 13.2375L14.452 12.6079ZM14.4981 12.0859L15.1488 12.8452L15.1488 12.8452L14.4981 12.0859ZM15.0057 12.1334L15.7826 11.5038L15.7826 11.5038L15.0057 12.1334ZM13.8474 17.8624C14.4316 18.363 15.3039 18.276 15.7826 17.6852L14.2288 16.426C14.4527 16.1497 14.8704 16.1052 15.1488 16.3437L13.8474 17.8624ZM13.675 15.9515C13.2095 16.5259 13.2798 17.3759 13.8474 17.8624L15.1488 16.3437C15.4106 16.5681 15.4396 16.9507 15.2289 17.2106L13.675 15.9515ZM15.2848 13.9649L13.675 15.9515L15.2289 17.2106L16.8387 15.2241L15.2848 13.9649ZM13.675 13.2375L15.2848 15.2241L16.8387 13.9649L15.2289 11.9784L13.675 13.2375ZM13.8474 11.3266C13.2798 11.813 13.2095 12.663 13.675 13.2375L15.2289 11.9784C15.4396 12.2383 15.4106 12.6209 15.1488 12.8452L13.8474 11.3266ZM15.7826 11.5038C15.3039 10.9129 14.4316 10.8259 13.8474 11.3266L15.1488 12.8452C14.8704 13.0838 14.4527 13.0393 14.2288 12.7629L15.7826 11.5038ZM15.7826 17.6852L17.7769 15.2241L16.2231 13.9649L14.2288 16.426L15.7826 17.6852ZM17.7769 13.9649L15.7826 11.5038L14.2288 12.7629L16.2231 15.2241L17.7769 13.9649Z" fill="currentColor" mask="url(#path-6-inside-2)" />
                                        </svg>
                                        Code
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </div>
                        <Tab.Content>
                            <Tab.Pane eventKey="first" className={toggleState === true ? "content  active-content" : "content"} id="content-toggle-prv" role="tabpanel" aria-labelledby="typo-output">
                                <div className="bd-example">
                                    <Form.Check className=" form-check-inline">
                                        <FormCheck.Input type="checkbox" className="form-check-input me-1" id="customCheck5" />
                                        <FormCheck.Label className="form-check-label pl-2" htmlFor="customCheck5">Checkbox</FormCheck.Label>
                                    </Form.Check>
                                    <Form.Check className=" form-check-inline">
                                        <FormCheck.Input type="checkbox" className="form-check-input me-1" id="customCheck6" defaultChecked />
                                        <FormCheck.Label className="form-check-label pl-2" htmlFor="customCheck6">Checked</FormCheck.Label>
                                    </Form.Check>
                                    <Form.Check className=" form-check-inline">
                                        <FormCheck.Input type="checkbox" className="me-1" id="customCheck7" disabled />
                                        <FormCheck.Label className=" pl-2" htmlFor="customCheck7">Disabled</FormCheck.Label>
                                    </Form.Check>
                                    <Form.Check className=" form-check-inline">
                                        <FormCheck.Input type="checkbox" className="me-1" id="customCheck8" defaultChecked
                                            disabled />
                                        <FormCheck.Label className=" pl-2" htmlFor="customCheck8">Disabled Checked</FormCheck.Label>
                                    </Form.Check>
                                </div>
                                <div className="bd-example">
                                    <Form.Check className=" form-check-inline">
                                        <FormCheck.Input type="radio" className="me-1" name="bsradio" id="radio1"
                                            defaultChecked />
                                        <FormCheck.Label htmlFor="radio1" className=" pl-2">Active</FormCheck.Label>
                                    </Form.Check>
                                    <Form.Check className=" form-check-inline">
                                        <FormCheck.Input type="radio" className="me-1" name="bsradio" id="radio2" />
                                        <FormCheck.Label htmlFor="radio2" className=" pl-2">Inactive</FormCheck.Label>
                                    </Form.Check>
                                    <div className="form-check form-check-inline">
                                        <FormCheck.Input type="radio" className="me-1" name="bsradio1" id="radio3"
                                            disabled defaultChecked />
                                        <FormCheck.Label htmlFor="radio3" className=" pl-2">Active - Disabled</FormCheck.Label>
                                    </div>
                                    <Form.Check className=" form-check-inline">
                                        <FormCheck.Input type="radio" className="me-1" name="bsradio1" id="radio4"
                                            disabled />
                                        <FormCheck.Label htmlFor="radio3" className=" pl-2">Inactive - Disabled</FormCheck.Label>
                                    </Form.Check>
                                </div>
                                <div className="bd-example">
                                    <Form.Check className="form-check form-switch form-check-inline">
                                        <FormCheck.Input type="checkbox" id="switch1" />
                                        <FormCheck.Label className=" pl-2" htmlFor="switch1">Off Switch</FormCheck.Label>
                                    </Form.Check>
                                    <div className="form-check form-switch form-check-inline">
                                        <FormCheck.Input type="checkbox" id="switch2" defaultChecked />
                                        <FormCheck.Label className=" pl-2" htmlFor="switch2">On Switch</FormCheck.Label>
                                    </div>
                                    <div className="form-check form-switch form-check-inline">
                                        <input className="form-check-input" type="checkbox" id="switch3" disabled />
                                        <FormCheck.Label className=" pl-2" htmlFor="switch3">Disabled Switch</FormCheck.Label>
                                    </div>
                                    <div className="form-check form-switch form-check-inline">
                                        <input className="form-check-input form-check-inline" type="checkbox" id="switch4" defaultChecked disabled />
                                        <FormCheck.Label htmlFor="switch4"> Switch</FormCheck.Label>
                                    </div>
                                </div>
                                <div className="bd-example">
                                    <Form.Group>
                                        <h3 htmlFor="customRange1">Example range</h3>
                                        <Form.Range />
                                    </Form.Group>
                                    <Form.Group>
                                        <div className="slider slider-primary my-3">
                                            {/* <Nouislider start={50} connect={[true, false]} orientation="horizontal" range={{ min: 0, max: 100 }}  /> */}
                                        </div>
                                    </Form.Group>
                                    <Form.Group>
                                        <div className="slider slider-secondary mb-3">
                                            {/* <Nouislider start={50} connect={[true, false]} orientation="horizontal" range={{ min: 0, max: 100 }}  /> */}
                                        </div>
                                    </Form.Group>
                                    <Form.Group>
                                        <div className="slider slider-success mb-3">
                                            {/* <Nouislider start={50} connect={[true, false]} orientation="horizontal" range={{ min: 0, max: 100 }}  /> */}
                                        </div>
                                    </Form.Group>
                                    <Form.Group>
                                        <div className="slider slider-danger mb-3">
                                            {/* <Nouislider start={50} connect={[true, false]} orientation="horizontal" range={{ min: 0, max: 100 }}  /> */}
                                        </div>
                                    </Form.Group>
                                    <Form.Group>
                                        <div className="slider slider-warning mb-3">
                                            {/* <Nouislider start={50} connect={[true, false]} orientation="horizontal" range={{ min: 0, max: 100 }}  /> */}
                                        </div>
                                    </Form.Group>
                                    <Form.Group>
                                        <div className="slider slider-dark mb-3">
                                            {/* <Nouislider start={50} connect={[true, false]} orientation="horizontal" range={{ min: 0, max: 100 }}  /> */}
                                        </div>
                                    </Form.Group>
                                </div>
                            </Tab.Pane>
                            <Tab.Pane eventKey="second" className={toggleState === false ? "content  active-content" : "content"} id="content-toggle-code" role="tabpanel" aria-labelledby="typo-output">
                                <div className="section-block">
                                    <pre className="language-markup"><code className="language-markup">
                                        {`<div className="bd-example">
    <Form.Check className=" form-check-inline">
        <FormCheck.Input type="checkbox" className="form-check-input" id="customCheck5"/>
        <FormCheck.Label className="form-check-label pl-2" htmlFor="customCheck5">Checkbox</FormCheck.Label>
    </Form.Check>
    <Form.Check className=" form-check-inline">
        <FormCheck.Input type="checkbox" className="form-check-input" id="customCheck6" defaultChecked/>
        <FormCheck.Label className="form-check-label pl-2" htmlFor="customCheck6">Checked</FormCheck.Label>
    </Form.Check>
    <Form.Check className=" form-check-inline">
        <FormCheck.Input type="checkbox" id="customCheck7" disabled=""/>
        <FormCheck.Label className=" pl-2" htmlFor="customCheck7">Disabled</FormCheck.Label>
    </Form.Check>
    <Form.Check className=" form-check-inline">
        <FormCheck.Input type="checkbox" id="customCheck8" defaultChecked
            disabled=""/>
        <FormCheck.Label  className=" pl-2" htmlFor="customCheck8">Disabled Checked</FormCheck.Label>
    </Form.Check>
</div>
<div className="bd-example">
    <Form.Check className=" form-check-inline">
        <FormCheck.Input type="radio" name="bsradio" id="radio1"
            defaultChecked/>
        <FormCheck.Label htmlFor="radio1" className=" pl-2">Active</FormCheck.Label>
    </Form.Check>
    <Form.Check className=" form-check-inline">
        <FormCheck.Input type="radio" name="bsradio" id="radio2"/>
        <FormCheck.Label htmlFor="radio2" className=" pl-2">Inactive</FormCheck.Label>
    </Form.Check>
    <div className="form-check form-check-inline">
        <FormCheck.Input type="radio" name="bsradio1" id="radio3"
            disabled="" defaultChecked/>
        <FormCheck.Label htmlFor="radio3" className=" pl-2">Active - Disabled</FormCheck.Label>
    </div>
    <Form.Check className=" form-check-inline">
        <FormCheck.Input type="radio" name="bsradio1" id="radio4"
            disabled=""/>
        <FormCheck.Label htmlFor="radio3" className=" pl-2">Inactive - Disabled</FormCheck.Label>
    </Form.Check>
</div>
<div className="bd-example">
    <Form.Check className=" form-switch form-check-inline">
        <FormCheck.Input type="checkbox" id="switch1" />
        <FormCheck.Label className=" pl-2" htmlFor="switch1">Off Switch</FormCheck.Label>
    </Form.Check>
    <div className="form-check form-switch form-check-inline">
        <FormCheck.Input type="checkbox" id="switch2" defaultChecked />
        <FormCheck.Label className=" pl-2" htmlFor="switch2">On Switch</FormCheck.Label>
    </div>
    <div className="form-check form-switch form-check-inline">
        <input className="form-check-input" type="checkbox" id="switch3" disabled />
        <FormCheck.Label className=" pl-2" htmlFor="switch3">Disabled Switch</FormCheck.Label>
    </div>
    <div className="form-check form-switch form-check-inline">
        <input className="form-check-input form-check-inline" type="checkbox" id="switch4" defaultChecked disabled />
        <FormCheck.Label className=" pl-2" htmlFor="switch4"> Switch</FormCheck.Label>
    </div>
</div>
<div className="bd-example">
    <Form.Group>
        <h3 htmlFor="customRange1">Example range</h3>
        {/* <input type="range" className="form-range w-100" id="customRange1"/> */}
        <Form.Range />
    </Form.Group>
    <Form.Group>
        <div className="slider"></div>
    </Form.Group>
    <Form.Group>
        <div className="slider slider-secondary"></div>
    </Form.Group>
    <Form.Group>
        <div className="slider slider-success"></div>
    </Form.Group>
    <Form.Group>
        <div className="slider slider-danger"></div>
    </Form.Group>
    <Form.Group>
        <div className="slider slider-warning"></div>
    </Form.Group>
    <Form.Group>
        <div className="slider slider-dark"></div>
    </Form.Group>
</div>
`}
                                    </code></pre>
                                </div>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </Card>
            </article>
        </>
    )
}
export default ToggleBtns;