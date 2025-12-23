# Implementation Plan: Unified Business Mode Switching

## Task Overview

Convert the feature design into a series of prompts for implementing the unified business mode switching system. Each task builds incrementally, starting with database updates, then middleware, controllers, UI components, and finally integration testing.

## Implementation Tasks

- [ ] 1. Update database models and schema
  - Update User model to include businessApplication tracking fields
  - Add indexes for businessApplication.status for performance
  - Create migration script to add new fields to existing users
  - Test database schema changes with existing data
  - _Requirements: 3.1, 3.2, 8.1, 8.2_

- [ ] 1.1 Write property test for User model business application tracking
  - **Property 1: Business application creates linked record**
  - **Validates: Requirements 3.1**

- [ ] 2. Create mode switching middleware system
  - Implement canAccessBusinessMode middleware function
  - Create switchToBusinessMode and switchToCustomerMode functions
  - Add requireCustomerMode and requireBusinessMode guards
  - Implement session mode tracking and validation
  - _Requirements: 1.2, 2.3, 2.4, 8.1_

- [ ] 2.1 Write property test for mode switching middleware
  - **Property 1: Mode switching preserves authentication**
  - **Validates: Requirements 2.3**

- [ ] 2.2 Write property test for business access control
  - **Property 2: Business status determines access**
  - **Validates: Requirements 1.2**

- [ ] 3. Implement mode switch controller
  - Create switchToBusiness controller function with status checking
  - Create switchToCustomer controller function
  - Implement getModeStatus API endpoint
  - Add error handling for invalid mode transitions
  - _Requirements: 1.3, 1.4, 1.5, 2.2, 7.1, 7.2_

- [ ] 3.1 Write property test for mode switch controller
  - **Property 5: Approval enables business mode access**
  - **Validates: Requirements 4.1**

- [ ] 4. Update authentication system for unified login
  - Modify login controller to set default currentMode to 'customer'
  - Update session management to track current mode
  - Ensure logout clears both customer and business mode data
  - Add session regeneration on mode switches for security
  - _Requirements: 2.3, 4.5, 8.1_

- [ ] 4.1 Write property test for session management
  - **Property 10: Logout clears all mode data**
  - **Validates: Requirements 4.5**

- [ ] 5. Create mode-aware navigation components
  - Update headerAndNavigation.ejs to show current mode indicator
  - Add mode switch button with appropriate styling
  - Implement mode-specific navigation menus
  - Add visual feedback for mode transitions
  - _Requirements: 6.1, 6.2, 6.5, 2.1_

- [ ] 6. Update existing customer routes for mode awareness
  - Add requireCustomerMode middleware to customer routes
  - Update customer controllers to check current mode
  - Ensure customer features are isolated from business context
  - Test that customer actions don't affect business data
  - _Requirements: 4.2, 8.3_

- [ ] 6.1 Write property test for customer mode data isolation
  - **Property 3: Mode-specific data isolation**
  - **Validates: Requirements 4.2**

- [ ] 7. Create business application integration
  - Update business registration to link with existing user accounts
  - Modify business application controller to update user businessApplication status
  - Implement document upload linking to user account
  - Add notification system for application status changes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 7.1 Write property test for business application workflow
  - **Property 4: Business application creates linked record**
  - **Validates: Requirements 3.1**

- [ ] 8. Implement business mode access and dashboard
  - Create business mode route protection
  - Update business dashboard to work with unified user system
  - Ensure business features are isolated from customer context
  - Add business-specific navigation and interface elements
  - _Requirements: 4.1, 4.3, 8.4_

- [ ] 8.1 Write property test for business mode data isolation
  - **Property 3: Mode-specific data isolation**
  - **Validates: Requirements 4.3**

- [ ] 9. Add reapplication functionality for rejected businesses
  - Create reapplication interface for rejected business applications
  - Implement status reset functionality for resubmissions
  - Add rejection reason display and reapplication form
  - Update admin notification system for reapplications
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9.1 Write property test for reapplication workflow
  - **Property 9: Reapplication resets status**
  - **Validates: Requirements 7.4**

- [ ] 10. Update admin interface for unified user management
  - Modify admin user management to show business application status
  - Update business approval workflow to work with user accounts
  - Ensure business approval enables user business mode access
  - Add business suspension functionality that preserves customer access
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 10.1 Write property test for admin business management
  - **Property 6: Rejection preserves customer access**
  - **Validates: Requirements 5.4**

- [ ] 10.2 Write property test for business suspension
  - **Property 7: Suspension isolates business access**
  - **Validates: Requirements 5.5**

- [ ] 11. Implement mode-specific notification system
  - Update notification model to support mode-specific notifications
  - Create separate notification counts for customer and business modes
  - Implement mode-aware notification display in navigation
  - Add notification filtering based on current mode
  - _Requirements: 4.4, 6.5_

- [ ] 11.1 Write property test for mode-specific notifications
  - **Property 8: Mode-specific notifications**
  - **Validates: Requirements 4.4**

- [ ] 12. Add mode switching routes and API endpoints
  - Create GET /switch-to-business route with access checking
  - Create GET /switch-to-customer route
  - Add GET /api/mode-status endpoint for frontend
  - Implement proper error handling and redirects
  - _Requirements: 1.2, 2.2, 8.1_

- [ ] 13. Create CSS styling for mode indicators and transitions
  - Design mode indicator badges (Customer Mode / Business Mode)
  - Create mode switch button styling
  - Add visual differentiation between customer and business modes
  - Implement smooth transition animations for mode switching
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 14. Update existing business owner views for unified system
  - Modify business registration forms to work with existing users
  - Update business dashboard to use unified authentication
  - Ensure business views check for proper mode and permissions
  - Add mode switching capability to business interface
  - _Requirements: 4.1, 4.3_

- [ ] 15. Checkpoint - Ensure all tests pass, ask the user if questions arise

- [ ] 16. Integration testing and bug fixes
  - Test complete user journey from customer to business owner
  - Verify mode switching works correctly in all scenarios
  - Test data isolation between customer and business modes
  - Fix any issues found during integration testing
  - _Requirements: All requirements_

- [ ] 16.1 Write integration tests for complete user flows
  - Test customer registration → business application → approval → mode switching
  - Test business rejection → reapplication workflow
  - Test business suspension → customer mode preservation

- [ ] 17. Performance optimization and security review
  - Add database indexes for businessApplication queries
  - Implement session security for mode switching
  - Add rate limiting for mode switch endpoints
  - Optimize navigation rendering for mode-specific content
  - _Requirements: 8.1, 8.2_

- [ ] 18. Documentation and deployment preparation
  - Update API documentation for new mode switching endpoints
  - Create user guide for mode switching functionality
  - Document database schema changes and migration steps
  - Prepare deployment scripts for production rollout
  - _Requirements: All requirements_

- [ ] 19. Final Checkpoint - Ensure all tests pass, ask the user if questions arise

## Implementation Notes

### Key Dependencies
- Tasks 1-4 must be completed before UI work (tasks 5-6)
- Business application integration (task 7) depends on database updates (task 1)
- Admin interface updates (task 10) depend on business application integration (task 7)
- Mode-specific notifications (task 11) depend on navigation updates (task 5)

### Testing Strategy
- Property-based tests focus on core business logic and data integrity
- Integration tests verify complete user workflows
- Manual testing ensures UI/UX meets requirements
- Performance testing validates system scalability

### Rollout Plan
1. **Phase 1**: Database and middleware (tasks 1-4)
2. **Phase 2**: UI and navigation (tasks 5-6)
3. **Phase 3**: Business integration (tasks 7-9)
4. **Phase 4**: Admin features (task 10)
5. **Phase 5**: Notifications and polish (tasks 11-14)
6. **Phase 6**: Testing and deployment (tasks 15-19)

### Success Criteria
- Existing customers can seamlessly switch to business mode
- Business application process works with unified accounts
- Data isolation is maintained between customer and business contexts
- Admin can manage unified user accounts with business applications
- System performance is not degraded by mode switching functionality