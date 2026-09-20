module SelfTestPkg

import JSON

"""
    roundtrip(x)

Encode `x` as JSON and parse it back. Exists so the package references a symbol
from a registered dependency: resolving `JSON` is what the self-test checks.
"""
roundtrip(x) = JSON.parse(JSON.json(x))

end
