import React from 'react'
import Index from '../views/dashboard/index'
// import { Switch, Route } from 'react-router-dom'
// user
import UserProfile from '../views/dashboard/app/user-profile';
import UserAdd from '../views/dashboard/app/user-add';
import UserList from '../views/dashboard/app/user-list';
import UserDashboard from '../views/dashboard/app/user-dashboard';
// import userProfileEdit from '../views/dashboard/app/user-privacy-setting';
import Createcontract from '../views/dashboard/from/Createcontract';
import FormValidation from '../views/dashboard/from/form-validation';
import Updatecontract from '../views/dashboard/from/Updatecontract';
// table
import ContractsTable from '../views/dashboard/table/ContractsTable';
import ClientsTable from '../views/dashboard/table/ClientsTable';
import Service from '../views/dashboard/table/Service';
//extra
// import PrivacyPolicy from '../views/dashboard/extra/privacy-policy';
// import TermsofService from '../views/dashboard/extra/terms-of-service';

//TransitionGroup
// import { TransitionGroup, CSSTransition } from "react-transition-group";
//Special Pages

//admin
import Admin from '../views/dashboard/admin/admin';
import Default from '../layouts/dashboard/default';


export const DefaultRouter = [
    {
        path: '/',
        element: <Default />,
        children: [
            {
                path: 'dashboard',
                element: <Index />
            },
            {
                path: 'dashboard-user',
                element: <UserDashboard />
            },
           
            {
                path: 'dashboard/app/user-profile',
                element: <UserProfile />
            },
            {
                path: 'dashboard/app/user-add',
                element: <UserAdd />
            },
            {
                path: 'dashboard/app/user-list',
                element: <UserList />
            },
            {
                path: 'dashboard/admin/admin',
                element: <Admin />
            },
            // Form
            {
                path: 'dashboard/contract/createcontract',
                element: <Createcontract />
            },
            {
                path: 'dashboard/contract/updatecontract/:id',
                element: <Updatecontract />
            },
            {
                path: 'dashboard/form/form-validation',
                element: <FormValidation />
            },
            // Table
            {
                path: 'dashboard/table/contracts-table',
                element: <ContractsTable />
            },
            {
                path: 'dashboard/table/clients-table',
                element: <ClientsTable />
            },
            {
                path: 'dashboard/table/service',
                element:<Service />
            }
        ]
    }
]
// const DefaultRouter = () => {
//     return (
//         <TransitionGroup>
//             <CSSTransition classNames="fadein" timeout={300}>
//                 <Switch>
//                     <Route path="/dashboard" exact component={Index} />
//                     {/* user */}
//                     <Route path="/dashboard/app/user-profile"     exact component={UserProfile} />
//                     <Route path="/dashboard/app/user-add"         exact component={UserAdd}/>
//                     <Route path="/dashboard/app/user-list"        exact component={UserList}/>
//                     <Route path="/dashboard/app/user-privacy-setting" exact component={userProfileEdit}/>
//                      {/* widget */}
//                      <Route path="/dashboard/widget/widgetbasic"   exact component={Widgetbasic}/>
//                      <Route path="/dashboard/widget/widgetcard"    exact component={Widgetcard}/>
//                      <Route path="/dashboard/widget/widgetchart"   exact component={Widgetchart}/>
//                      {/* icon */}
//                      <Route path="/dashboard/icon/solid"           exact component={Solid}/>
//                      <Route path="/dashboard/icon/outline"         exact component={Outline}/>
//                      <Route path="/dashboard/icon/dual-tone"       exact component={DualTone}/>
//                      {/* From */}
//                      <Route path="/dashboard/contract/Createcontract"    exact component={Createcontract}/>
//                      <Route path="/dashboard/form/form-validation" exact component={FormValidation}/>
//                      <Route path="/dashboard/form/form-wizard"     exact component={FormWizard}/>
//                      {/* table */}
//                      <Route path="/dashboard/table/contracts-table" exact component={ContractsTable}/>
//                      <Route path="/dashboard/table/clients-table"      exact component={ClientsTable}/>
//                      {/*special pages */}
//                      <Route path="/dashboard/special-pages/billing" exact component={Billing}/>
//                      <Route path="/dashboard/special-pages/kanban" exact component={Kanban}/>
//                      <Route path="/dashboard/special-pages/pricing" exact component={Pricing}/>
//                      <Route path="/dashboard/special-pages/timeline" exact component={Timeline}/>
//                      <Route path="/dashboard/special-pages/calender" exact component={Calender}/>
//                      {/* map */}
//                      <Route path="/dashboard/map/vector" exact component={Vector}/>
//                      <Route path="/dashboard/map/google" exact component={Google}/>
//                      {/* extra */}
//                      <Route path="/dashboard/extra/privacy-policy" exact component={PrivacyPolicy}/>
//                      <Route path="/dashboard/extra/terms-of-service" exact component={TermsofService}/>
//                      {/*admin*/}
//                      <Route path="/dashboard/admin/admin" exact component={Admin}/>
//                 </Switch>
//             </CSSTransition>
//         </TransitionGroup>
//     )
// }

// export default DefaultRouter
