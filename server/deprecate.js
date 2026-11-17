// Week 13: tells every caller, on every response, that an endpoint is going away.
//   Deprecation: true                      -> "this is deprecated"
//   Sunset: <HTTP date>                    -> the day it stops working
//   Link: <successor>; rel="successor-version" -> where to go instead
function deprecated({ sunset, successor }) {
  const sunsetHeader = new Date(sunset).toUTCString(); // '2026-12-16' -> 'Wed, 16 Dec 2026 00:00:00 GMT'
  return (req, res, next) => {
    res.set('Deprecation', 'true');
    res.set('Sunset', sunsetHeader);
    res.set('Link', `<${successor}>; rel="successor-version"`);
    next();
  };
}

module.exports = { deprecated };
