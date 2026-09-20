using SelfTestPkg
using Test

# Never run by CI -- `julialint` only reads it. It is here so the package has a
# test target to resolve, which is the environment the self-test is about.
@test SelfTestPkg.roundtrip(Dict("a" => 1)) == Dict("a" => 1)
