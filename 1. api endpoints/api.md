source: https://chatgpt.com/c/6a78f04e-a004-83ea-9ba5-47d215edf9d2


USERS

    GET     /users                          (get all users)
    GET     /users/:id                      (gel a specific user)


VENUES

    GET     /venues
    GET     /venues/:id


EVENTS

    GET     /events                         (get all events)
    GET     /events/:id                     (get a specific event)


AVAILABILITY
    
    GET     /events/:id/availability        (get availability of a specific event)


BOOKINGS

    GET     /users/:id/bookings             (what bookings the user already has)
    POST    /events/:id/book                (create a booking for a user)
    DELETE  /bookings/:id                   (cancel a booking for a user)

